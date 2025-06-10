const express = require('express');
const router = express.Router();

const { db } = require('../Database'); // Import the SQLite database instance

const rateLimiter = require('../middleware/rateLimiter');
router.post('/register', rateLimiter, async (req, res) => {
    console.log('Requisição recebida em /register:', req.body);
    const { hwid, username, key, password } = req.body;

    // Verificar a validade da chave (Check key validity)
    const validKey = db.prepare('SELECT * FROM keys WHERE key = ? AND used = 0 AND expirationDate > ?').get(key, new Date().toISOString());
    if (!validKey) {
        return res.status(403).json({ error: 'Chave inválida ou expirada.' });
    }

    // Check if user already exists (by username)
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
        return res.status(400).json({ error: 'Usuário já existe.' });
    }

    try {
        // Marcar a chave como usada (Mark the key as used)
        db.prepare('UPDATE keys SET used = 1 WHERE id = ?').run(validKey.id);

        let expirationDate = new Date(validKey.expirationDate);

        // Create new user in the database
        const stmt = db.prepare('INSERT INTO users (hwid, username, expirationDate, password) VALUES (?, ?, ?, ?)');
        const info = stmt.run(hwid, username, expirationDate.toISOString(), password);

        console.log('User salvo no banco de dados, ID:', info.lastInsertRowid);

        res.json({ message: 'Login criado com sucesso', expirationDate });
    } catch (error) {
        console.error('Erro ao registrar user ou usar key no SQLite:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

module.exports = router;