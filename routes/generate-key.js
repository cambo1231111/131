const express = require('express');
const router = express.Router();

const { db } = require('../Database'); // Import the SQLite database instance

const rateLimiter = require('../middleware/rateLimiter');

router.post('/generate-key', rateLimiter, async (req, res) => {
    const { key, duration } = req.body;

    if (!key || !duration) {
        return res.status(400).json({ error: 'Key e duração são obrigatórios.' });
    }

    try {
        let expirationDate;

        switch (duration) {
            case '1day':
                expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 1);
                break;
            case '1week':
                expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);
                break;
            case '1month':
                expirationDate = new Date();
                expirationDate.setMonth(expirationDate.getMonth() + 1);
                break;
            case '3month':
                expirationDate = new Date();
                expirationDate.setMonth(expirationDate.getMonth() + 3);
                break;
            case 'permanente':
                expirationDate = null; // Or a very distant future date
                break;
            default:
                console.error('Duração inválida:', duration);
                return res.status(400).json({ error: 'Duração inválida.' });
        }

        // Insert new key into the database
        const stmt = db.prepare('INSERT INTO keys (key, expirationDate) VALUES (?, ?)');
        const info = stmt.run(key, expirationDate ? expirationDate.toISOString() : null);

        console.log('Chave gerada:', key);
        console.log('Chave armazenada, ID:', info.lastInsertRowid);

        res.json({ key: key }); // Return the key directly
    } catch (error) {
        console.error('Erro ao salvar key no SQLite:', error);
        // Check for unique constraint violation if key already exists
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Key já existe.' });
        }
        // Check for database connection errors
        if (error.code === 'SQLITE_CANTOPEN' || error.code === 'SQLITE_READONLY') {
            return res.status(500).json({ error: 'Erro de conexão com o banco de dados.' });
        }
        res.status(500).json({ error: 'Erro ao gerar key: ' + error.message });
    }
});

module.exports = router;