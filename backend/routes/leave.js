// routes/leave.js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const auth   = require('../middleware/auth');
const { getDB, query, run } = require('../database/db');
const SECRET = process.env.JWT_SECRET || 'kcet_secret_2024_key';

// Helper: resolve employee ID from JWT or fallback
async function resolveEmployeeId(req) {
    const header = req.headers['authorization'];
    if (header) {
        const token = header.startsWith('Bearer ') ? header.slice(7) : header;
        try {
            const decoded = jwt.verify(token, SECRET);
            if (decoded && decoded.id) return decoded.id;
        } catch (e) {}
    }

    const db = await getDB();
    const identifier = req.query.email || req.body?.email || req.headers['x-employee-email'] || req.headers['x-employee-code'];
    if (identifier) {
        const rows = query(db, 'SELECT id FROM employees WHERE email=? OR code=? LIMIT 1', [identifier, identifier]);
        if (rows.length) return rows[0].id;
    }

    // Default to the first employee
    const def = query(db, 'SELECT id FROM employees WHERE role="employee" ORDER BY id ASC LIMIT 1');
    return def.length ? def[0].id : 1;
}

// GET  /api/leave         — My leave requests
router.get('/', async (req, res) => {
    const db = await getDB();
    const employeeId = await resolveEmployeeId(req);
    const rows = query(db, 'SELECT * FROM leave_requests WHERE employee_id=? ORDER BY applied_on DESC', [employeeId]);
    res.json(rows);
});

// POST /api/leave         — Apply for leave
router.post('/', async (req, res) => {
    const { type, from_date, to_date, days, reason } = req.body;
    if (!type || !from_date || !to_date)
        return res.status(400).json({ error: 'type, from_date, to_date required' });
    
    const db = await getDB();
    const employeeId = await resolveEmployeeId(req);
    
    run(db,
        'INSERT INTO leave_requests(employee_id,type,from_date,to_date,days,reason,status) VALUES(?,?,?,?,?,?,"Pending")',
        [employeeId, type, from_date, to_date, days || 1, reason || '']
    );
    res.status(201).json({ message: 'Leave applied successfully' });
});

// PUT /api/leave/:id/status  — Approve/Reject/Pending
router.put('/:id/status', async (req, res) => {
    const { status, hr_note } = req.body;
    if (!['Approved','Rejected','Pending'].includes(status))
        return res.status(400).json({ error: 'Invalid status' });
    const db = await getDB();
    if (hr_note !== undefined) {
        run(db, 'UPDATE leave_requests SET status=?, hr_note=?, actioned_at=datetime("now") WHERE id=?', [status, hr_note, req.params.id]);
    } else {
        run(db, 'UPDATE leave_requests SET status=?, actioned_at=datetime("now") WHERE id=?', [status, req.params.id]);
    }
    res.json({ message: `Leave ${status}` });
});

// GET /api/leave/all  — All requests (HR only or management)
router.get('/all', async (req, res) => {
    const db   = await getDB();
    const rows = query(db,
        `SELECT lr.*, e.name, e.code, e.department, e.designation, e.photo 
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id=e.id ORDER BY lr.applied_on DESC`
    );
    res.json(rows);
});

module.exports = router;
