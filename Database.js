require('colors')
const sqlite = require('better-sqlite3');
const db = new sqlite('database.db'); // This will create the database file if it doesn't exist

function initializeDatabase() {
    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT,
            hwid TEXT,
            expirationDate DATETIME NOT NULL,
            hwidBanned BOOLEAN DEFAULT 0
        )
    `);

    // Create keys table
    db.exec(`
        CREATE TABLE IF NOT EXISTS keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            expirationDate DATETIME NOT NULL,
            used BOOLEAN DEFAULT 0,
            hwidBanned BOOLEAN DEFAULT 0
        )
    `);

    console.log("Sucesso ".green + 'SQLite database initialized and tables created/verified.');
}

module.exports = {
    db,
    initializeDatabase
};