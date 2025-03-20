const { Pool } = require('pg');

// Connect to the database using the environment variable
const pool = new Pool({
    connectionString: process.env.NEON_CONN_STR,
    ssl: {
        rejectUnauthorized: false
    }
});

// Create table if not exists function
async function ensureTableExists() {
    try {
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
        return true;
    } catch (error) {
        console.error('Table creation error:', error);
        return false;
    }
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request (for CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Ensure the table exists
        await ensureTableExists();

        const rsvpData = req.body;

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

        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Error storing RSVP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}; 