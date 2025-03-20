require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { storeRSVP } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// RSVP endpoint
app.post('/api/rsvp', async (req, res) => {
    try {
        const rsvpData = {
            ...req.body,
            speakerName: req.body.speakerName,
            sessionDate: req.body.sessionDate
        };

        const result = await storeRSVP(rsvpData);

        if (result.success) {
            res.status(201).json({ success: true, id: result.id });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, error: 'Server error occurred' });
    }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running correctly!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 