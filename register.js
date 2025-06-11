const express = require('express');
const router = express.Router();
const { db } = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');
const verifySignature = require('../middleware/verifySignature');

router.post('/register', rateLimiter, verifySignature, async (req, res) => {
    console.log('Request received at /register:', req.body);
    const { hwid, key } = req.body;

    // Check key validity
    const validKey = db.prepare('SELECT * FROM keys WHERE key = ? AND used = 0 AND expirationDate > ?').get(key, new Date().toISOString());
    if (!validKey) {
        return res.status(403).json({ error: 'Invalid or expired key.' });
    }

    // Check if HWID is already registered
    const existingUser = db.prepare('SELECT * FROM users WHERE hwid = ?').get(hwid);
    if (existingUser) {
        return res.status(400).json({ error: 'HWID already registered.' });
    }

    try {
        // Mark the key as used
        db.prepare('UPDATE keys SET used = 1 WHERE id = ?').run(validKey.id);

        let expirationDate = new Date(validKey.expirationDate);

        // Create new user in the database
        const stmt = db.prepare('INSERT INTO users (hwid, expirationDate) VALUES (?, ?)');
        const info = stmt.run(hwid, expirationDate.toISOString());

        console.log('User saved to database, ID:', info.lastInsertRowid);

        res.json({ message: 'Registration successful', expirationDate });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user.' });
    }
});

module.exports = router;
