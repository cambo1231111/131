const express = require('express');
const router = express.Router();

const { db } = require('../Database'); // Import the SQLite database instance

const rateLimiter = require('../middleware/rateLimiter');

router.delete('/remove-login', rateLimiter, async (req, res) => {
    const { id } = req.body;

    try {
        // Find and delete the user by ID
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: 'Login não encontrado' });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(id);

        res.json({ message: 'Login removido com sucesso', username: user.username });
    } catch (error) {
        console.error('Erro ao remover login no SQLite:', error);
        res.status(500).json({ error: 'Erro ao remover login' });
    }
});

module.exports = router;