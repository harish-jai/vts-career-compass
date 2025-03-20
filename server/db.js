require('dotenv').config();
const { Pool } = require('pg');

// Connect to the database using the environment variable
const pool = new Pool({
    connectionString: process.env.NEON_CONN_STR,
    ssl: {
        rejectUnauthorized: false // May be needed for Neon connections
    }
});

// Function to store RSVP data
async function storeRSVP(rsvpData) {
    try {
        // Create the table if it doesn't exist (run this once)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        branch VARCHAR(100) NOT NULL,
        questions TEXT,
        opt_in BOOLEAN DEFAULT FALSE,
        speaker_name VARCHAR(255) NOT NULL,
        session_date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Insert the RSVP data
        const result = await pool.query(
            `INSERT INTO rsvps (name, email, phone, branch, questions, opt_in, speaker_name, session_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
            [
                rsvpData.name,
                rsvpData.email,
                rsvpData.phone || null,
                rsvpData.branch,
                rsvpData.questions || null,
                rsvpData.optIn,
                rsvpData.speakerName,
                rsvpData.sessionDate
            ]
        );

        return { success: true, id: result.rows[0].id };
    } catch (error) {
        console.error('Database error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    storeRSVP,
    pool
}; 