// routes/pay.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB, query, run } = require('../database/db');

// GET /api/pay  — My payslips
router.get('/', auth, async (req, res) => {
    const db   = await getDB();
    const rows = query(db,
        'SELECT * FROM payslips WHERE employee_id=? ORDER BY rowid DESC',
        [req.user.id]
    );
    res.json(rows);
});

// GET /api/pay/:month  — Specific month payslip
router.get('/:month', auth, async (req, res) => {
    const db   = await getDB();
    const rows = query(db,
        'SELECT * FROM payslips WHERE employee_id=? AND month=?',
        [req.user.id, decodeURIComponent(req.params.month)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Payslip not found' });
    res.json(rows[0]);
});

// POST /api/pay  — Add payslip (HR only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'hr')
        return res.status(403).json({ error: 'HR access only' });
    const { employee_id, month, basic, hra, allowances, deductions, net_pay } = req.body;
    const db = await getDB();
    run(db,
        'INSERT INTO payslips(employee_id,month,basic,hra,allowances,deductions,net_pay) VALUES(?,?,?,?,?,?,?)',
        [employee_id, month, basic, hra, allowances, deductions, net_pay]
    );
    res.status(201).json({ message: 'Payslip added' });
});

module.exports = router;
