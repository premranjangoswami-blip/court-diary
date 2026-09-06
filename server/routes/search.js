const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/search?q=<term>
 *
 * Searches (case-insensitive, partial) across:
 *   case_number, party_name, party_mobile, court_name, opposite_party, advocate_name
 */
router.get('/', (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });

    const like = `%${q}%`;

    const results = db.all(`
      SELECT c.*,
        (SELECT hearing_date FROM hearings h
          WHERE h.case_id = c.id AND h.is_completed = 0
          ORDER BY h.hearing_date ASC LIMIT 1) AS next_hearing_date
      FROM cases c
      WHERE LOWER(c.case_number)    LIKE LOWER(?)
         OR LOWER(c.party_name)     LIKE LOWER(?)
         OR c.party_mobile          LIKE ?
         OR LOWER(c.court_name)     LIKE LOWER(?)
         OR LOWER(c.opposite_party) LIKE LOWER(?)
         OR LOWER(c.advocate_name)  LIKE LOWER(?)
      ORDER BY c.case_number ASC
      LIMIT 100
    `, [like, like, like, like, like, like]);

    res.json({ success: true, data: results, query: q });
  } catch (err) { next(err); }
});

module.exports = router;
