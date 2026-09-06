const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res, next) => {
  try {
    const todayStr = req.query._today || new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const statsRow = db.get(`
      SELECT
        COUNT(*)                                              AS total_cases,
        SUM(CASE WHEN status = 'Active'   THEN 1 ELSE 0 END) AS active_cases,
        SUM(CASE WHEN status = 'Disposed' THEN 1 ELSE 0 END) AS disposed_cases,
        SUM(CASE WHEN status = 'Stayed'   THEN 1 ELSE 0 END) AS stayed_cases
      FROM cases
    `, []);

    const hearingQ = (start, end) => db.all(`
      SELECT h.*, c.case_number, c.case_type, c.court_name,
             c.party_name, c.opposite_party, c.party_mobile,
             c.advocate_name, c.status AS case_status
      FROM hearings h
      JOIN cases c ON c.id = h.case_id
      WHERE h.hearing_date >= ? AND h.hearing_date <= ?
      ORDER BY h.hearing_date ASC, c.case_number ASC
    `, [start, end]);

    const today_hearings    = hearingQ(todayStr, todayStr);
    const tomorrow_hearings = hearingQ(tomorrowStr, tomorrowStr);

    // upcoming = day after tomorrow through +7 days
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().slice(0, 10);
    const upcoming_hearings = hearingQ(dayAfterTomorrowStr, weekEndStr);

    res.json({
      success: true,
      data: { stats: statsRow, today_hearings, tomorrow_hearings, upcoming_hearings },
    });
  } catch (err) { next(err); }
});

module.exports = router;
