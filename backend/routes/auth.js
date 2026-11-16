// routes/auth.js  —  Login & Profile endpoints
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDB, query, run } = require('../database/db');

const SECRET = process.env.JWT_SECRET || 'kcet_secret_2024_key';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password required' });

        const db  = await getDB();
        const rows = query(db, 'SELECT * FROM employees WHERE email = ?', [email]);
        if (!rows.length)
            return res.status(401).json({ error: 'Email not registered in KCET system' });

        const emp = rows[0];
        const ok  = await bcrypt.compare(password, emp.password);
        if (!ok)
            return res.status(401).json({ error: 'Incorrect password' });

        const token = jwt.sign(
            { id: emp.id, email: emp.email, role: emp.role, name: emp.name, code: emp.code },
            SECRET,
            { expiresIn: '8h' }
        );

        // Remove password before sending
        delete emp.password;
        res.json({ token, employee: emp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me  —  Get logged-in user profile
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const db   = await getDB();
        const rows = query(db, 'SELECT * FROM employees WHERE id = ?', [req.user.id]);
        if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
        const emp = rows[0];
        delete emp.password;
        res.json(emp);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
