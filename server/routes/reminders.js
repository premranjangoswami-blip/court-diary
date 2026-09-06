const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res, next) => {
  try {
    const todayStr = req.query._today || new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const reminders = db.all(`
      SELECT
        h.id            AS hearing_id,
        h.hearing_date,
        h.purpose,
        h.court_remarks,
        h.is_completed,
        c.id            AS case_id,
        c.case_number,
        c.case_type,
        c.court_name,
        c.party_name,
        c.opposite_party,
        c.party_mobile,
        c.advocate_name,
        c.status        AS case_status
      FROM hearings h
      JOIN cases c ON c.id = h.case_id
      WHERE h.hearing_date >= ? AND h.hearing_date <= ? AND h.is_completed = 0
      ORDER BY h.hearing_date ASC, c.case_number ASC
    `, [todayStr, weekEndStr]);

    const enriched = reminders.map((r) => {
      const hDate = new Date(r.hearing_date);
      const diff = Math.round((hDate - today) / (1000 * 60 * 60 * 24));
      return {
        ...r,
        days_until: diff,
        label: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
});

module.exports = router;
