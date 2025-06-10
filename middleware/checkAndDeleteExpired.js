const { db } = require('../Database'); // Import the SQLite database instance

async function checkAndDeleteExpired(req, res, next) {
    const now = new Date().toISOString();
    
    // Delete expired users
    const stmt = db.prepare('DELETE FROM users WHERE expirationDate < ?');
    const info = stmt.run(now);

    if (info.changes > 0) {
        console.log(`Deleted ${info.changes} expired users.`);
        // Note: We might not want to return 403 here if other valid requests are made simultaneously.
        // This middleware is usually for background cleanup or pre-auth check.
        // For now, keeping the original logic of returning 403 if *any* deletion occurred,
        // which might be intended to force re-login for any potentially expired user.
        return res.status(403).json({ error: 'Login expirado. Por favor, renove seu login.' });
    }
    next();
}

module.exports = checkAndDeleteExpired;