const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const db = require('../db');
const validate = require('../middleware/validate');

// ── Validation rules ─────────────────────────────────────────────────────────

const caseRules = [
  body('case_number').trim().notEmpty().withMessage('Case number is required'),
  body('case_type').trim().notEmpty().withMessage('Case type is required'),
  body('court_name').trim().notEmpty().withMessage('Court name is required'),
  body('party_name').trim().notEmpty().withMessage('Party/client name is required'),
  body('status')
    .optional()
    .isIn(['Active', 'Disposed', 'Stayed'])
    .withMessage('Status must be Active, Disposed, or Stayed'),
  body('party_mobile')
    .optional({ checkFalsy: true })
    .matches(/^[0-9+\-\s()]{7,15}$/)
    .withMessage('Invalid mobile number'),
  body('previous_date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Previous date must be YYYY-MM-DD'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /api/cases */
router.get('/', (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT c.*,
        (SELECT COUNT(*) FROM hearings h WHERE h.case_id = c.id) AS total_hearings,
        (SELECT hearing_date FROM hearings h
          WHERE h.case_id = c.id AND h.is_completed = 0
          ORDER BY h.hearing_date ASC LIMIT 1) AS next_hearing_date
      FROM cases c
    `;
    const params = [];
    if (status) { sql += ' WHERE c.status = ?'; params.push(status); }
    sql += ' ORDER BY c.created_at DESC';
    res.json({ success: true, data: db.all(sql, params) });
  } catch (err) { next(err); }
});

/** GET /api/cases/:id */
router.get('/:id', (req, res, next) => {
  try {
    const row = db.get(`
      SELECT c.*,
        (SELECT COUNT(*) FROM hearings h WHERE h.case_id = c.id) AS total_hearings,
        (SELECT hearing_date FROM hearings h
          WHERE h.case_id = c.id AND h.is_completed = 0
          ORDER BY h.hearing_date ASC LIMIT 1) AS next_hearing_date
      FROM cases c WHERE c.id = ?
    `, [req.params.id]);
    if (!row) { const e = new Error('Case not found'); e.status = 404; return next(e); }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

/** POST /api/cases */
router.post('/', caseRules, validate, (req, res, next) => {
  try {
    const {
      case_number, case_type, court_name, police_station, gr_number,
      party_name, opposite_party, party_mobile, advocate_name,
      status = 'Active', notes, previous_date, position,
    } = req.body;

    const result = db.run(`
      INSERT INTO cases
        (case_number, case_type, court_name, police_station, gr_number,
         party_name, opposite_party, party_mobile, advocate_name,
         status, notes, previous_date, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      case_number, case_type, court_name, police_station || null,
      gr_number || null, party_name, opposite_party || null,
      party_mobile || null, advocate_name || null,
      status, notes || null,
      previous_date || null, position || null,
    ]);

    const created = db.get('SELECT * FROM cases WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      err.status = 409; err.message = 'A case with that case number already exists';
    }
    next(err);
  }
});

/** PUT /api/cases/:id */
router.put('/:id', caseRules, validate, (req, res, next) => {
  try {
    const existing = db.get('SELECT id FROM cases WHERE id = ?', [req.params.id]);
    if (!existing) { const e = new Error('Case not found'); e.status = 404; return next(e); }

    const {
      case_number, case_type, court_name, police_station, gr_number,
      party_name, opposite_party, party_mobile, advocate_name,
      status, notes, previous_date, position,
    } = req.body;

    db.run(`
      UPDATE cases SET
        case_number = ?, case_type = ?, court_name = ?,
        police_station = ?, gr_number = ?, party_name = ?,
        opposite_party = ?, party_mobile = ?, advocate_name = ?,
        status = ?, notes = ?, previous_date = ?, position = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      case_number, case_type, court_name, police_station || null,
      gr_number || null, party_name, opposite_party || null,
      party_mobile || null, advocate_name || null,
      status || 'Active', notes || null,
      previous_date || null, position || null,
      req.params.id,
    ]);

    const updated = db.get('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      err.status = 409; err.message = 'A case with that case number already exists';
    }
    next(err);
  }
});

/** DELETE /api/cases/:id */
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.get('SELECT id FROM cases WHERE id = ?', [req.params.id]);
    if (!existing) { const e = new Error('Case not found'); e.status = 404; return next(e); }
    db.run('DELETE FROM cases WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Case deleted successfully' });
  } catch (err) { next(err); }
});

// ── Hearings sub-resource ────────────────────────────────────────────────────

const hearingRules = [
  body('hearing_date')
    .notEmpty().withMessage('Hearing date is required')
    .isISO8601().withMessage('Hearing date must be YYYY-MM-DD'),
  body('next_date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Next date must be YYYY-MM-DD'),
  body('purpose').optional().trim(),
  body('court_remarks').optional().trim(),
  body('outcome').optional().trim(),
  body('is_completed').optional().isBoolean().withMessage('is_completed must be boolean'),
];

/** GET /api/cases/:id/hearings */
router.get('/:id/hearings', (req, res, next) => {
  try {
    const caseRow = db.get('SELECT id FROM cases WHERE id = ?', [req.params.id]);
    if (!caseRow) { const e = new Error('Case not found'); e.status = 404; return next(e); }
    const hearings = db.all(
      'SELECT * FROM hearings WHERE case_id = ? ORDER BY hearing_date DESC',
      [req.params.id]
    );
    res.json({ success: true, data: hearings });
  } catch (err) { next(err); }
});

/** POST /api/cases/:id/hearings */
router.post('/:id/hearings', hearingRules, validate, (req, res, next) => {
  try {
    const caseRow = db.get('SELECT id FROM cases WHERE id = ?', [req.params.id]);
    if (!caseRow) { const e = new Error('Case not found'); e.status = 404; return next(e); }

    const {
      hearing_date, next_date, purpose, court_remarks, outcome, is_completed = false,
    } = req.body;

    const result = db.run(`
      INSERT INTO hearings (case_id, hearing_date, next_date, purpose, court_remarks, outcome, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.params.id, hearing_date, next_date || null,
      purpose || null, court_remarks || null, outcome || null,
      is_completed ? 1 : 0,
    ]);

    const created = db.get('SELECT * FROM hearings WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

module.exports = router;
