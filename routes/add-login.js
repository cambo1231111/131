const express = require('express');
const router = express.Router();

const { db } = require('../Database'); // Import the SQLite database instance
const moment = require('moment');

const rateLimiter = require('../middleware/rateLimiter');

router.post('/add-login', rateLimiter, async (req, res) => {
    console.log('Requisição recebida em /add-login:', req.body);
    const { hwid, username, duration, password } = req.body;

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
        return res.status(400).json({ error: 'Usuário já existe.' });
    }

    let expirationDate;
    switch (duration) {
        case '1week':
            expirationDate = moment().add(7, 'days').toDate();
            break;
        case '1month':
            expirationDate = moment().add(1, 'months').toDate();
            break;
        case '3month':
            expirationDate = moment().add(3, 'months').toDate();
            break;
        case 'permanent':
            expirationDate = moment().add(100, 'years').toDate(); // Very distant future date
            break;
        case 'teste':
            expirationDate = moment().add(3, 'minute').toDate();
            break;
        default:
            console.error('Duração inválida:', duration);
            return res.status(400).json({ error: 'Invalid duration' });
    }

    try {
        // Insert new user into the database
        const stmt = db.prepare('INSERT INTO users (hwid, username, expirationDate, password) VALUES (?, ?, ?, ?)');
        const info = stmt.run(hwid, username, expirationDate.toISOString(), password);
        console.log('User salvo no banco de dados, ID:', info.lastInsertRowid);

        res.json({ message: 'Login adicionado com sucesso', expirationDate });
    } catch (error) {
        console.error('Erro ao salvar user no SQLite:', error);
        res.status(500).json({ error: 'Erro ao adicionar login.' }); // Generic error for client
    }
});

module.exports = router;