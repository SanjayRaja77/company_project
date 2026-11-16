// ============================================================
//  KCET Employee Management System — Backend Server
//  Stack: Node.js + Express + sql.js (SQLite) + JWT + bcryptjs
// ============================================================
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/leave',      require('./routes/leave'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/pay',        require('./routes/pay'));
app.use('/api/helpdesk',   require('./routes/helpdesk'));
app.use('/api/hr',         require('./routes/hr'));

// ── Serve frontend static files ──
app.use(express.static(path.join(__dirname, '..')));

// ── Catch-all: serve index.html for client-side routes ──
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   KCET Employee Management System       ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  ✅  Server: http://localhost:${PORT}        ║`);
    console.log(`║  🗄️  Database: backend/database/kcet.db  ║`);
    console.log('╚══════════════════════════════════════════╝\n');
});
