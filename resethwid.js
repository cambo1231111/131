const express = require('express');
const router = express.Router();

const { db } = require('../Database'); // Import the SQLite database instance

const rateLimiter = require('../middleware/rateLimiter');

router.post('/reset-hwid', rateLimiter, async (req, res) => {
    const { hwid } = req.body;

    try {
        // Find the user by HWID
        const user = db.prepare('SELECT * FROM users WHERE hwid = ?').get(hwid);
        if (!user) {
            return res.status(404).json({ message: 'HWID não encontrado' });
        }

        // Reset HWID
        db.prepare('UPDATE users SET hwid = NULL WHERE id = ?').run(user.id);

        res.json({ message: 'HWID resetado com sucesso' });
    } catch (error) {
        console.error('Erro ao resetar HWID no SQLite:', error);
        res.status(500).json({ message: 'Erro ao resetar HWID' });
    }
});

module.exports = router;