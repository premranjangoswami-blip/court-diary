/**
 * API Integration tests — uses an in-memory sql.js database.
 * Run: npm run test:server
 */

const request = require('supertest');
const app     = require('../index');
const dbModule = require('../db');

// ── Setup: fresh in-memory DB before each suite ───────────────────────────────
beforeAll(async () => {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const mem = new SQL.Database();
  mem.run('PRAGMA foreign_keys = ON;');
  dbModule.migrate(mem);
  // Patch persist() so tests don't touch the disk
  const orig = dbModule.persist;
  dbModule.persist = () => {};
  dbModule.setDb(mem);
});

afterAll(() => {
  dbModule.setDb(null);
});

// Reset data between tests
beforeEach(() => {
  const d = dbModule.getDb();
  d.run('DELETE FROM hearings');
  d.run('DELETE FROM cases');
  d.run("DELETE FROM sqlite_sequence WHERE name='cases'");
  d.run("DELETE FROM sqlite_sequence WHERE name='hearings'");
});

// ── Helper ─────────────────────────────────────────────────────────────────────
const CASE_PAYLOAD = {
  case_number:    'CC/001/2024',
  case_type:      'Criminal',
  court_name:     'District Court, Lucknow',
  party_name:     'Ram Kumar',
  police_station: 'Hazratganj',
  gr_number:      'GR/55/2024',
  opposite_party: 'State of UP',
  party_mobile:   '9876543210',
  advocate_name:  'Adv. Sharma',
  status:         'Active',
};

async function createCase(overrides = {}) {
  return request(app).post('/api/cases').send({ ...CASE_PAYLOAD, ...overrides });
}

// ── Health ─────────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Cases CRUD ─────────────────────────────────────────────────────────────────
describe('Cases API', () => {
  it('POST /api/cases — creates a case', async () => {
    const res = await createCase();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.case_number).toBe('CC/001/2024');
    expect(res.body.data.status).toBe('Active');
  });

  it('POST /api/cases — rejects missing required fields', async () => {
    const res = await request(app).post('/api/cases').send({ case_number: 'X' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('POST /api/cases — rejects duplicate case number', async () => {
    await createCase();
    const res = await createCase();
    expect(res.status).toBe(409);
  });

  it('POST /api/cases — rejects invalid mobile', async () => {
    const res = await createCase({ party_mobile: 'notamobile' });
    expect(res.status).toBe(422);
  });

  it('GET /api/cases — lists all cases', async () => {
    await createCase();
    await createCase({ case_number: 'CC/002/2024' });
    const res = await request(app).get('/api/cases');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('GET /api/cases?status=Active — filters by status', async () => {
    await createCase();
    await createCase({ case_number: 'CC/002/2024', status: 'Disposed' });
    const res = await request(app).get('/api/cases?status=Active');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('Active');
  });

  it('GET /api/cases/:id — returns a single case', async () => {
    const created = await createCase();
    const id = created.body.data.id;
    const res = await request(app).get(`/api/cases/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('GET /api/cases/:id — 404 for unknown id', async () => {
    const res = await request(app).get('/api/cases/99999');
    expect(res.status).toBe(404);
  });

  it('PUT /api/cases/:id — updates a case', async () => {
    const created = await createCase();
    const id = created.body.data.id;
    const res = await request(app)
      .put(`/api/cases/${id}`)
      .send({ ...CASE_PAYLOAD, status: 'Disposed', advocate_name: 'New Advocate' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Disposed');
    expect(res.body.data.advocate_name).toBe('New Advocate');
  });

  it('DELETE /api/cases/:id — deletes a case', async () => {
    const created = await createCase();
    const id = created.body.data.id;
    const del = await request(app).delete(`/api/cases/${id}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/cases/${id}`);
    expect(get.status).toBe(404);
  });
});

// ── Hearings ───────────────────────────────────────────────────────────────────
describe('Hearings API', () => {
  let caseId;

  beforeEach(async () => {
    const res = await createCase();
    caseId = res.body.data.id;
  });

  it('POST /api/cases/:id/hearings — adds a hearing', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/hearings`)
      .send({ hearing_date: '2024-06-15', purpose: 'Argument' });
    expect(res.status).toBe(201);
    expect(res.body.data.hearing_date).toBe('2024-06-15');
    expect(res.body.data.case_id).toBe(caseId);
  });

  it('POST /api/cases/:id/hearings — rejects missing date', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/hearings`)
      .send({ purpose: 'Argument' });
    expect(res.status).toBe(422);
  });

  it('GET /api/cases/:id/hearings — lists hearings for a case', async () => {
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-06-15' });
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-07-01' });
    const res = await request(app).get(`/api/cases/${caseId}/hearings`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('PUT /api/hearings/:id — updates a hearing', async () => {
    const add = await request(app)
      .post(`/api/cases/${caseId}/hearings`)
      .send({ hearing_date: '2024-06-15', purpose: 'Argument' });
    const hId = add.body.data.id;
    const res = await request(app)
      .put(`/api/hearings/${hId}`)
      .send({ hearing_date: '2024-06-20', purpose: 'Judgement', is_completed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.purpose).toBe('Judgement');
    expect(res.body.data.is_completed).toBe(1);
  });

  it('DELETE /api/hearings/:id — deletes a hearing', async () => {
    const add = await request(app)
      .post(`/api/cases/${caseId}/hearings`)
      .send({ hearing_date: '2024-06-15' });
    const hId = add.body.data.id;
    const del = await request(app).delete(`/api/hearings/${hId}`);
    expect(del.status).toBe(200);
    const list = await request(app).get(`/api/cases/${caseId}/hearings`);
    expect(list.body.data.length).toBe(0);
  });

  it('hearings cascade delete when case is deleted', async () => {
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-06-15' });
    await request(app).delete(`/api/cases/${caseId}`);
    const res = await request(app).get(`/api/cases/${caseId}/hearings`);
    expect(res.status).toBe(404);
  });
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
describe('Dashboard API', () => {
  it('GET /api/dashboard — returns stats and hearing lists', async () => {
    await createCase();
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.today_hearings).toBeDefined();
    expect(res.body.data.tomorrow_hearings).toBeDefined();
    expect(res.body.data.upcoming_hearings).toBeDefined();
  });

  it('GET /api/dashboard — today hearing shows up', async () => {
    const c = await createCase();
    const caseId = c.body.data.id;
    const today = '2024-06-15';
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: today });
    const res = await request(app).get(`/api/dashboard?_today=${today}`);
    expect(res.body.data.today_hearings.length).toBe(1);
    expect(res.body.data.tomorrow_hearings.length).toBe(0);
  });

  it('GET /api/dashboard — tomorrow hearing shows up correctly', async () => {
    const c = await createCase();
    const caseId = c.body.data.id;
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-06-16' });
    const res = await request(app).get('/api/dashboard?_today=2024-06-15');
    expect(res.body.data.tomorrow_hearings.length).toBe(1);
  });
});

// ── Search ─────────────────────────────────────────────────────────────────────
describe('Search API', () => {
  beforeEach(async () => {
    await createCase({ case_number: 'CC/001/2024', party_name: 'Ram Kumar',  party_mobile: '9876543210' });
    await createCase({ case_number: 'CC/002/2024', party_name: 'Sita Devi',  party_mobile: '8765432109' });
  });

  it('GET /api/search?q= — empty query returns []', async () => {
    const res = await request(app).get('/api/search?q=');
    expect(res.body.data).toEqual([]);
  });

  it('searches by case number', async () => {
    const res = await request(app).get('/api/search?q=CC%2F001');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].case_number).toBe('CC/001/2024');
  });

  it('searches by party name (case-insensitive)', async () => {
    const res = await request(app).get('/api/search?q=ram');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].party_name).toBe('Ram Kumar');
  });

  it('searches by mobile number', async () => {
    const res = await request(app).get('/api/search?q=8765432109');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].party_mobile).toBe('8765432109');
  });

  it('returns all matches for broad query', async () => {
    const res = await request(app).get('/api/search?q=CC%2F');
    expect(res.body.data.length).toBe(2);
  });
});

// ── Reminders ─────────────────────────────────────────────────────────────────
describe('Reminders API', () => {
  it('GET /api/reminders — returns hearings within 7 days', async () => {
    const c = await createCase();
    const caseId = c.body.data.id;
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-06-16' });
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-06-23' }); // 8 days out
    const res = await request(app).get('/api/reminders?_today=2024-06-15');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].hearing_date).toBe('2024-06-16');
  });

  it('GET /api/reminders — days_until and label are correct', async () => {
    const c = await createCase();
    const caseId = c.body.data.id;
    await request(app).post(`/api/cases/${caseId}/hearings`).send({ hearing_date: '2024-06-15' });
    const res = await request(app).get('/api/reminders?_today=2024-06-15');
    expect(res.body.data[0].days_until).toBe(0);
    expect(res.body.data[0].label).toBe('Today');
  });
});
