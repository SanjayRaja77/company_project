// routes/helpdesk.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB, query, run } = require('../database/db');

// GET /api/helpdesk   — My tickets
router.get('/', auth, async (req, res) => {
    const db   = await getDB();
    const rows = query(db,
        'SELECT * FROM helpdesk WHERE employee_id=? ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json(rows);
});

// POST /api/helpdesk  — Raise ticket
router.post('/', auth, async (req, res) => {
    const { subject, category, description } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject required' });
    const db = await getDB();
    run(db,
        'INSERT INTO helpdesk(employee_id,subject,category,description) VALUES(?,?,?,?)',
        [req.user.id, subject, category || 'General', description || '']
    );
    res.status(201).json({ message: 'Ticket raised' });
});

// PUT /api/helpdesk/:id/status  — Update status (HR)
router.put('/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'hr')
        return res.status(403).json({ error: 'HR access only' });
    const { status } = req.body;
    const db = await getDB();
    run(db, 'UPDATE helpdesk SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
});

// GET /api/helpdesk/all  — All tickets (HR)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'hr')
        return res.status(403).json({ error: 'HR access only' });
    const db   = await getDB();
    const rows = query(db,
        `SELECT h.*, e.name, e.code FROM helpdesk h
         JOIN employees e ON h.employee_id=e.id ORDER BY h.created_at DESC`
    );
    res.json(rows);
});

module.exports = router;
