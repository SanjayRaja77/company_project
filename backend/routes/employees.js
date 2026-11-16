// routes/employees.js  —  Employee profile CRUD
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB, query, run } = require('../database/db');

// GET /api/employees/profile  —  Own profile
router.get('/profile', auth, async (req, res) => {
    const db   = await getDB();
    const rows = query(db, 'SELECT * FROM employees WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const emp = rows[0]; delete emp.password;
    res.json(emp);
});

// PUT /api/employees/profile  —  Update own profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, designation, department, experience, photo, completeness } = req.body;
        const db = await getDB();
        run(db,
            `UPDATE employees SET name=COALESCE(?,name), phone=COALESCE(?,phone),
             designation=COALESCE(?,designation), department=COALESCE(?,department),
             experience=COALESCE(?,experience), photo=COALESCE(?,photo),
             completeness=COALESCE(?,completeness)
             WHERE id=?`,
            [name, phone, designation, department, experience, photo, completeness, req.user.id]
        );
        const rows = query(db, 'SELECT * FROM employees WHERE id=?', [req.user.id]);
        const emp  = rows[0]; delete emp.password;
        res.json({ message: 'Profile updated', employee: emp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/employees  —  All employees (HR only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'hr')
        return res.status(403).json({ error: 'HR access only' });
    const db   = await getDB();
    const rows = query(db, 'SELECT id,code,name,email,role,designation,department,phone,experience,completeness FROM employees');
    res.json(rows);
});

// GET /api/employees/:id  —  Single employee (HR only)
router.get('/:id', auth, async (req, res) => {
    if (req.user.role !== 'hr' && req.user.id !== parseInt(req.params.id))
        return res.status(403).json({ error: 'Access denied' });
    const db   = await getDB();
    const rows = query(db, 'SELECT * FROM employees WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const emp  = rows[0]; delete emp.password;
    res.json(emp);
});

module.exports = router;
