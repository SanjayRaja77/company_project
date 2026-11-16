// ============================================================
//  database/db.js  —  SQLite via sql.js (pure JS, no native build)
// ============================================================
const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');
const bcrypt    = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'kcet.db');
let   _db     = null;

// Save DB to disk every time it changes
function persistDB() {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getDB() {
    if (_db) return _db;

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        _db = new SQL.Database(fileBuffer);
    } else {
        _db = new SQL.Database();
        await initSchema();
        await seedData();
    }

    // Always run migrations on existing databases to ensure new columns exist
    try { _db.run("ALTER TABLE leave_requests ADD COLUMN hr_note TEXT;"); } catch (e) {}
    try { _db.run("ALTER TABLE leave_requests ADD COLUMN actioned_at TEXT;"); } catch (e) {}
    persistDB();

    return _db;
}

async function initSchema() {
    _db.run(`
        CREATE TABLE IF NOT EXISTS employees (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            code        TEXT    UNIQUE NOT NULL,
            name        TEXT    NOT NULL,
            email       TEXT    UNIQUE NOT NULL,
            password    TEXT    NOT NULL,
            role        TEXT    DEFAULT 'employee',
            designation TEXT,
            department  TEXT,
            phone       TEXT,
            experience  TEXT,
            completeness INTEGER DEFAULT 89,
            photo       TEXT,
            created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS leave_requests (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            type        TEXT    NOT NULL,
            from_date   TEXT    NOT NULL,
            to_date     TEXT    NOT NULL,
            days        INTEGER,
            reason      TEXT,
            status      TEXT    DEFAULT 'Pending',
            hr_note     TEXT,
            actioned_at TEXT,
            applied_on  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY(employee_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            date        TEXT    NOT NULL,
            status      TEXT    DEFAULT 'Present',
            check_in    TEXT,
            check_out   TEXT,
            FOREIGN KEY(employee_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS payslips (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            month       TEXT    NOT NULL,
            basic       REAL,
            hra         REAL,
            allowances  REAL,
            deductions  REAL,
            net_pay     REAL,
            FOREIGN KEY(employee_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS helpdesk (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            subject     TEXT    NOT NULL,
            category    TEXT,
            description TEXT,
            status      TEXT    DEFAULT 'Open',
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY(employee_id) REFERENCES employees(id)
        );
    `);

    // Migrations for existing databases
    try { _db.run("ALTER TABLE leave_requests ADD COLUMN hr_note TEXT;"); } catch (e) {}
    try { _db.run("ALTER TABLE leave_requests ADD COLUMN actioned_at TEXT;"); } catch (e) {}
}

async function seedData() {
    // Seed 4 registered employees (passwords hashed)
    const employees = [
        { code:'7001089', name:'Vimal Kumar S', email:'vimalkumar.s@kcet.com',  pwd:'Vimal@2024',    role:'employee', designation:'Team Leader',              dept:'Engineering', phone:'8012616806', exp:'07.08 years' },
        { code:'7001090', name:'Saravanan K',   email:'saravanan.k@kcet.com',   pwd:'Sara@2024',     role:'employee', designation:'Software Engineer',         dept:'IT',          phone:'9876543210', exp:'03.05 years' },
        { code:'HR0001',  name:'Admin User',    email:'admin@kcet.com',          pwd:'Admin@2024',    role:'hr',       designation:'HR Manager',               dept:'HR',          phone:'9000000001', exp:'10.00 years' },
        { code:'EMP001',  name:'Employee User', email:'employee@kcet.com',       pwd:'Employee@1',    role:'employee', designation:'Junior Software Engineer',  dept:'IT',          phone:'9000000002', exp:'01.00 years' },
    ];

    for (const e of employees) {
        const hash = await bcrypt.hash(e.pwd, 10);
        _db.run(
            `INSERT OR IGNORE INTO employees(code,name,email,password,role,designation,department,phone,experience)
             VALUES(?,?,?,?,?,?,?,?,?)`,
            [e.code, e.name, e.email, hash, e.role, e.designation, e.dept, e.phone, e.exp]
        );
    }

    // Seed payslips for Vimal
    const months = ['January 2024','February 2024','March 2024'];
    months.forEach(m => {
        _db.run(
            `INSERT OR IGNORE INTO payslips(employee_id,month,basic,hra,allowances,deductions,net_pay)
             SELECT id,?,35000,14000,5000,4500,49500 FROM employees WHERE code='7001089'`,
            [m]
        );
    });
}

// ── Helper: run a query and get all rows as objects ──
function query(db, sql, params = []) {
    const stmt    = db.prepare(sql);
    const results = [];
    stmt.bind(params);
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
}

// ── Helper: run INSERT/UPDATE/DELETE ──
function run(db, sql, params = []) {
    db.run(sql, params);
    persistDB();
}

module.exports = { getDB, query, run, persistDB };
