const express = require('express');
const router = express.Router();
const { db } = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');
const checkAndDeleteExpired = require('../middleware/checkAndDeleteExpired');
const verifySignature = require('../middleware/verifySignature');

router.post('/auth', rateLimiter, verifySignature, checkAndDeleteExpired, async (req, res) => {
    console.log('Request received at /auth:', req.body);
    const { hwid, key } = req.body;

    try {
        // Check if key exists and is valid
        const validKey = db.prepare('SELECT * FROM keys WHERE key = ? AND used = 0 AND expirationDate > ?').get(key, new Date().toISOString());
        if (!validKey) {
            return res.status(403).json({ error: 'Invalid or expired key.' });
        }

        // Check if user exists with this HWID
        let user = db.prepare('SELECT * FROM users WHERE hwid = ?').get(hwid);

        if (!user) {
            // Create new user if doesn't exist
            const expirationDate = new Date(validKey.expirationDate);
            const stmt = db.prepare('INSERT INTO users (hwid, expirationDate) VALUES (?, ?)');
            const info = stmt.run(hwid, expirationDate.toISOString());
            user = { hwid, expirationDate };
        }

        // Check expiration date
        if (new Date(user.expirationDate) < new Date()) {
            db.prepare('DELETE FROM users WHERE hwid = ?').run(hwid);
            return res.status(403).json({ error: 'Login expired. Please renew your login.' });
        }

        return res.json({ message: 'Login successful!' });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication error.' });
    }
});

module.exports = router;
