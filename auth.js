const express = require('express');
const router = express.Router();

const { db } = require('../Database'); // Import the SQLite database instance

const rateLimiter = require('../middleware/rateLimiter');
const checkAndDeleteExpired = require('../middleware/checkAndDeleteExpired');

router.post('/auth', rateLimiter, checkAndDeleteExpired, async (req, res) => {
    console.log('Requisição recebida em /auth:', req.body);
    const { hwid, username, password } = req.body;

    try {
        let user;

        // Try to find user by HWID first
        if (hwid) {
            user = db.prepare('SELECT * FROM users WHERE hwid = ?').get(hwid);
        }

        // If not found by HWID but username is provided, try by username
        if (!user && username) {
            user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            if (user && !user.hwid) {
                // If user found by username but no HWID, update HWID
                db.prepare('UPDATE users SET hwid = ? WHERE id = ?').run(hwid, user.id);
                user.hwid = hwid; // Update the user object in memory as well
            }
        }

        console.log('Usuário encontrado:', user);

        if (!user) {
            return res.status(404).json({ error: 'Discord ID não encontrado.' });
        }

        // Check expiration date
        if (new Date(user.expirationDate) < new Date()) {
            db.prepare('DELETE FROM users WHERE hwid = ?').run(hwid);
            return res.status(403).json({ error: 'Login expirado. Por favor, renove seu login.' });
        }

        if (user.username === username) {
            if (user.password) {
                if (user.password === password) {
                    return res.json({ message: 'Login bem-sucedido!' });
                } else {
                    return res.status(403).json({ error: 'Senha incorreta.' });
                }
            } else {
                return res.json({ message: 'Login bem-sucedido!' });
            }
        } else {
            return res.status(403).json({ error: 'Usuário Inválido.' });
        }
    } catch (error) {
        console.error('Erro ao autenticar:', error);
        res.status(500).json({ error: 'Erro ao autenticar.' });
    }
});

module.exports = router;