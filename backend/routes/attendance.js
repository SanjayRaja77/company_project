// routes/attendance.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB, query, run } = require('../database/db');

// GET /api/attendance         — My attendance
router.get('/', auth, async (req, res) => {
    const db   = await getDB();
    const rows = query(db,
        'SELECT * FROM attendance WHERE employee_id=? ORDER BY date DESC',
        [req.user.id]
    );
    res.json(rows);
});

// POST /api/attendance/checkin  — Check in
router.post('/checkin', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date().toTimeString().slice(0, 5);
    const db    = await getDB();
    const exist = query(db, 'SELECT * FROM attendance WHERE employee_id=? AND date=?', [req.user.id, today]);
    if (exist.length)
        return res.status(400).json({ error: 'Already checked in today' });
    run(db,
        'INSERT INTO attendance(employee_id,date,status,check_in) VALUES(?,?,?,?)',
        [req.user.id, today, 'Present', now]
    );
    res.json({ message: 'Checked in', time: now });
});

// PUT /api/attendance/checkout  — Check out
router.put('/checkout', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date().toTimeString().slice(0, 5);
    const db    = await getDB();
    run(db,
        'UPDATE attendance SET check_out=? WHERE employee_id=? AND date=?',
        [now, req.user.id, today]
    );
    res.json({ message: 'Checked out', time: now });
});

// GET /api/attendance/all  — All (HR only)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'hr')
        return res.status(403).json({ error: 'HR access only' });
    const db   = await getDB();
    const rows = query(db,
        `SELECT a.*, e.name, e.code FROM attendance a
         JOIN employees e ON a.employee_id=e.id ORDER BY a.date DESC`
    );
    res.json(rows);
});

module.exports = router;
