// routes/hr.js  —  Extended HR-only endpoints
const router = require('express').Router();
const auth   = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { getDB, query, run } = require('../database/db');

function hrOnly(req, res, next) {
    if (req.user.role !== 'hr') return res.status(403).json({ error: 'HR access only' });
    next();
}

// ── Dashboard Stats ──────────────────────────────
// GET /api/hr/stats
router.get('/stats', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const today = new Date().toISOString().split('T')[0];

    const [{ total }]   = query(db, "SELECT COUNT(*) as total FROM employees WHERE role='employee'");
    const [{ present }] = query(db, "SELECT COUNT(*) as present FROM attendance WHERE date=? AND status='Present'", [today]);
    const [{ onLeave }] = query(db, "SELECT COUNT(*) as onLeave FROM leave_requests WHERE ? BETWEEN from_date AND to_date AND status='Approved'", [today]);
    const [{ pending }] = query(db, "SELECT COUNT(*) as pending FROM leave_requests WHERE status='Pending'");
    const [{ tickets }] = query(db, "SELECT COUNT(*) as tickets FROM helpdesk WHERE status='Open'");

    const absent = Math.max(0, total - present - onLeave);

    res.json({ total, present, absent, onLeave, pending, tickets });
});

// GET /api/hr/recent-activities
router.get('/recent-activities', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const leaves = query(db,
        `SELECT 'leave' as type, lr.id, e.name, lr.type as leave_type, lr.status, lr.applied_on as time
         FROM leave_requests lr JOIN employees e ON lr.employee_id=e.id
         ORDER BY lr.applied_on DESC LIMIT 5`
    );
    const tickets = query(db,
        `SELECT 'helpdesk' as type, h.id, e.name, h.subject, h.status, h.created_at as time
         FROM helpdesk h JOIN employees e ON h.employee_id=e.id
         ORDER BY h.created_at DESC LIMIT 5`
    );
    const checkins = query(db,
        `SELECT 'attendance' as type, a.id, e.name, a.check_in, a.date as time
         FROM attendance a JOIN employees e ON a.employee_id=e.id
         ORDER BY a.date DESC LIMIT 5`
    );
    const all = [...leaves, ...tickets, ...checkins]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);
    res.json(all);
});

// ── Employees (HR view) ──────────────────────────
// GET /api/hr/employees  — full list with all info
router.get('/employees', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const emps = query(db,
        'SELECT id,code,name,email,role,designation,department,phone,experience,completeness,photo,created_at FROM employees ORDER BY code'
    );
    res.json(emps);
});

// GET /api/hr/employees/:id — full profile of one employee
router.get('/employees/:id', auth, hrOnly, async (req, res) => {
    const db  = await getDB();
    const rows = query(db, 'SELECT * FROM employees WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const emp = rows[0]; delete emp.password;

    // Enrich with related data
    const attendance = query(db,
        'SELECT * FROM attendance WHERE employee_id=? ORDER BY date DESC LIMIT 30', [emp.id]);
    const leaves = query(db,
        'SELECT * FROM leave_requests WHERE employee_id=? ORDER BY applied_on DESC', [emp.id]);
    const payslips = query(db,
        'SELECT * FROM payslips WHERE employee_id=? ORDER BY rowid DESC', [emp.id]);
    const helpdesk = query(db,
        'SELECT * FROM helpdesk WHERE employee_id=? ORDER BY created_at DESC', [emp.id]);

    res.json({ ...emp, attendance, leaves, payslips, helpdesk });
});

// ── Approvals ────────────────────────────────────
// GET /api/hr/approvals — all pending + recent requests
router.get('/approvals', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const rows = query(db,
        `SELECT lr.*, e.name, e.code, e.designation, e.department, e.photo
         FROM leave_requests lr JOIN employees e ON lr.employee_id=e.id
         ORDER BY CASE lr.status WHEN 'Pending' THEN 0 ELSE 1 END, lr.applied_on DESC`
    );
    res.json(rows);
});

// PUT /api/hr/approvals/:id — approve/reject/pending with optional note
router.put('/approvals/:id', auth, hrOnly, async (req, res) => {
    const { status, hr_note } = req.body;
    if (!['Approved','Rejected','Pending'].includes(status))
        return res.status(400).json({ error: 'Status must be Approved, Rejected, or Pending' });
    const db = await getDB();
    if (hr_note !== undefined) {
        run(db, 'UPDATE leave_requests SET status=?, hr_note=?, actioned_at=datetime("now") WHERE id=?', [status, hr_note, req.params.id]);
    } else {
        run(db, 'UPDATE leave_requests SET status=?, actioned_at=datetime("now") WHERE id=?', [status, req.params.id]);
    }
    res.json({ message: `Leave request ${status}`, status });
});

// ── Payroll ──────────────────────────────────────
// GET /api/hr/payroll — all employees payroll summary
router.get('/payroll', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const rows = query(db,
        `SELECT e.id, e.code, e.name, e.designation, e.department,
                p.month, p.basic, p.hra, p.allowances, p.deductions, p.net_pay,
                p.id as payslip_id
         FROM employees e LEFT JOIN payslips p ON e.id=p.employee_id
         WHERE e.role='employee'
         ORDER BY e.code, p.rowid DESC`
    );
    res.json(rows);
});

// POST /api/hr/payroll — create payslip for employee
router.post('/payroll', auth, hrOnly, async (req, res) => {
    const { employee_id, month, basic, hra, allowances, deductions } = req.body;
    if (!employee_id || !month) return res.status(400).json({ error: 'employee_id and month required' });
    const net_pay = (parseFloat(basic)||0) + (parseFloat(hra)||0) + (parseFloat(allowances)||0) - (parseFloat(deductions)||0);
    const db = await getDB();
    run(db,
        'INSERT INTO payslips(employee_id,month,basic,hra,allowances,deductions,net_pay) VALUES(?,?,?,?,?,?,?)',
        [employee_id, month, basic||0, hra||0, allowances||0, deductions||0, net_pay]
    );
    res.status(201).json({ message: 'Payslip created', net_pay });
});

// ── Reports ──────────────────────────────────────
// GET /api/hr/reports/attendance
router.get('/reports/attendance', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const rows = query(db,
        `SELECT e.code, e.name, e.department,
                COUNT(CASE WHEN a.status='Present' THEN 1 END) as present_days,
                COUNT(CASE WHEN a.status='Absent'  THEN 1 END) as absent_days,
                COUNT(a.id) as total_days
         FROM employees e LEFT JOIN attendance a ON e.id=a.employee_id
         WHERE e.role='employee' GROUP BY e.id ORDER BY e.code`
    );
    res.json(rows);
});

// GET /api/hr/reports/leave
router.get('/reports/leave', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const rows = query(db,
        `SELECT e.code, e.name, e.department,
                COUNT(CASE WHEN lr.status='Approved' THEN 1 END) as approved,
                COUNT(CASE WHEN lr.status='Rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN lr.status='Pending'  THEN 1 END) as pending,
                SUM(CASE WHEN lr.status='Approved' THEN lr.days ELSE 0 END) as total_days
         FROM employees e LEFT JOIN leave_requests lr ON e.id=lr.employee_id
         WHERE e.role='employee' GROUP BY e.id ORDER BY e.code`
    );
    res.json(rows);
});

// GET /api/hr/reports/payroll
router.get('/reports/payroll', auth, hrOnly, async (req, res) => {
    const db = await getDB();
    const rows = query(db,
        `SELECT e.code, e.name, e.department, e.designation,
                p.month, p.basic, p.hra, p.allowances, p.deductions, p.net_pay
         FROM employees e JOIN payslips p ON e.id=p.employee_id
         WHERE e.role='employee' ORDER BY e.code, p.rowid DESC`
    );
    res.json(rows);
});

// ── Settings ─────────────────────────────────────
// GET /api/hr/settings — HR profile
router.get('/settings', auth, hrOnly, async (req, res) => {
    const db   = await getDB();
    const rows = query(db, 'SELECT * FROM employees WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const emp = rows[0]; delete emp.password;
    res.json(emp);
});

// PUT /api/hr/settings — Update HR profile
router.put('/settings', auth, hrOnly, async (req, res) => {
    const { name, phone, photo } = req.body;
    const db = await getDB();
    run(db,
        'UPDATE employees SET name=COALESCE(?,name), phone=COALESCE(?,phone), photo=COALESCE(?,photo) WHERE id=?',
        [name, phone, photo, req.user.id]
    );
    res.json({ message: 'Settings updated' });
});

// PUT /api/hr/settings/password — Change password
router.put('/settings/password', auth, hrOnly, async (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
        return res.status(400).json({ error: 'Both passwords required' });
    const db   = await getDB();
    const rows = query(db, 'SELECT * FROM employees WHERE id=?', [req.user.id]);
    const ok   = await bcrypt.compare(current_password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    run(db, 'UPDATE employees SET password=? WHERE id=?', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
});

module.exports = router;
