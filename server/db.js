/**
 * db.js — SQLite wrapper using sql.js (pure JS, no native binaries needed).
 *
 * sql.js runs SQLite compiled to WebAssembly/JS.
 * Persistence: the database is saved to disk as a binary file after every
 * write operation. On startup the file is loaded back if it exists.
 */

const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, '..', 'court_diary.db');

let _db   = null;  // sql.js Database instance
let _SQL  = null;  // sql.js module

// ── Module initialisation (async because sql.js loads a WASM file) ─────────────

async function initSqlJs() {
  if (_SQL) return _SQL;
  const initSql = require('sql.js');
  _SQL = await initSql();
  return _SQL;
}

/**
 * Returns a ready-to-use sql.js Database (synchronously after first init).
 * Throws if called before `openDb()` has resolved.
 */
function getDb() {
  if (!_db) throw new Error('Database not initialised. Did you await openDb()?');
  return _db;
}

/**
 * Open (or create) the database, run migrations, return the db instance.
 * Call this once at server startup: await openDb()
 */
async function openDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON;');
  migrate(_db);
  persist();          // save initial state / newly migrated schema
  return _db;
}

/**
 * Write the current database state to disk.
 * Call after every INSERT / UPDATE / DELETE.
 */
function persist() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * Create all tables and indexes if they don't exist yet.
 * Also applies incremental ALTER TABLE migrations for new columns
 * so existing databases are upgraded without data loss.
 */
function migrate(db) {
  // ── Initial schema ───────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number    TEXT    NOT NULL UNIQUE,
      case_type      TEXT    NOT NULL,
      court_name     TEXT    NOT NULL,
      police_station TEXT,
      gr_number      TEXT,
      party_name     TEXT    NOT NULL,
      opposite_party TEXT,
      party_mobile   TEXT,
      advocate_name  TEXT,
      status         TEXT    NOT NULL DEFAULT 'Active',
      notes          TEXT,
      created_at     DATETIME DEFAULT (datetime('now')),
      updated_at     DATETIME DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS hearings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id       INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      hearing_date  DATE    NOT NULL,
      purpose       TEXT,
      court_remarks TEXT,
      outcome       TEXT,
      is_completed  INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME DEFAULT (datetime('now'))
    );
  `);

  // ── Incremental migrations — add new columns to existing databases ────────
  // SQLite does not support IF NOT EXISTS on ALTER TABLE, so we try/catch each.
  const addColumnIfMissing = (table, column, definition) => {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (e) {
      // Column already exists — ignore "duplicate column name" error
      if (!e.message || !e.message.includes('duplicate column name')) throw e;
    }
  };

  // v2 — paper-diary fields for cases
  addColumnIfMissing('cases', 'previous_date', 'DATE');
  addColumnIfMissing('cases', 'position', 'TEXT');

  // v2 — next hearing date stored on the hearing record itself
  addColumnIfMissing('hearings', 'next_date', 'DATE');

  // ── Indexes ───────────────────────────────────────────────────────────────
  db.run(`CREATE INDEX IF NOT EXISTS idx_hearings_case_id      ON hearings(case_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_hearings_hearing_date ON hearings(hearing_date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cases_case_number     ON cases(case_number);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cases_party_name      ON cases(party_name);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cases_party_mobile    ON cases(party_mobile);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cases_court_name      ON cases(court_name);`);
}

// ── Thin query helpers that mirror better-sqlite3's synchronous API ────────────
// This lets the route files stay the same; we just swap the driver here.

/**
 * Execute a statement that returns rows (SELECT).
 * Returns an array of plain objects.
 */
function all(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Execute a statement that returns at most one row.
 */
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute an INSERT / UPDATE / DELETE statement.
 * Returns { lastInsertRowid, changes }.
 */
function run(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  const lastInsertRowid = db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? null;
  persist();
  return { lastInsertRowid };
}

/**
 * Execute a raw SQL string (used for migrations / multi-statement blocks).
 */
function exec(sql) {
  const db = getDb();
  db.run(sql);
  persist();
}

// Allow tests to inject an in-memory db instance directly
function setDb(instance) {
  _db = instance;
}

module.exports = { openDb, getDb, setDb, migrate, all, get, run, exec, persist };
