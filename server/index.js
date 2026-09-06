const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { openDb } = require('./db');

const casesRouter     = require('./routes/cases');
const hearingsRouter  = require('./routes/hearings');
const dashboardRouter = require('./routes/dashboard');
const searchRouter    = require('./routes/search');
const remindersRouter = require('./routes/reminders');
const errorHandler    = require('./middleware/errorHandler');

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/cases',     casesRouter);
app.use('/api/hearings',  hearingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/search',    searchRouter);
app.use('/api/reminders', remindersRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Serve built frontend in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));
  app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  openDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Court Diary API running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to open database:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.openDb = openDb; // exported for test setup
