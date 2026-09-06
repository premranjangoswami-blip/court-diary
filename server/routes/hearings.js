const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const db = require('../db');
const validate = require('../middleware/validate');

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

/** PUT /api/hearings/:id */
router.put('/:id', hearingRules, validate, (req, res, next) => {
  try {
    const existing = db.get('SELECT * FROM hearings WHERE id = ?', [req.params.id]);
    if (!existing) { const e = new Error('Hearing not found'); e.status = 404; return next(e); }

    const { hearing_date, next_date, purpose, court_remarks, outcome, is_completed } = req.body;

    db.run(`
      UPDATE hearings SET
        hearing_date  = ?,
        next_date     = ?,
        purpose       = ?,
        court_remarks = ?,
        outcome       = ?,
        is_completed  = ?
      WHERE id = ?
    `, [
      hearing_date,
      next_date     || null,
      purpose       || null,
      court_remarks || null,
      outcome       || null,
      is_completed !== undefined ? (is_completed ? 1 : 0) : existing.is_completed,
      req.params.id,
    ]);

    const updated = db.get('SELECT * FROM hearings WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

/** DELETE /api/hearings/:id */
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.get('SELECT id FROM hearings WHERE id = ?', [req.params.id]);
    if (!existing) { const e = new Error('Hearing not found'); e.status = 404; return next(e); }
    db.run('DELETE FROM hearings WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Hearing deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
