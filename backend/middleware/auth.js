// middleware/auth.js  —  JWT verification middleware
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'kcet_secret_2024_key';

module.exports = function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'No token provided' });

    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
