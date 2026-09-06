/**
 * Quick verification script — creates a case, adds a hearing, checks dashboard.
 * Run: node verify.js
 */

const http = require('http');

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  console.log('\n=== Court Diary API Verification ===\n');

  // 1. Health check
  const health = await req('GET', '/api/health', null);
  console.log('[1] Health:', health.body.status === 'ok' ? '✓ OK' : '✗ FAILED');

  // 2. Create a case
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const c1 = await req('POST', '/api/cases', {
    case_number: 'TEST/001/2026',
    case_type: 'Criminal',
    court_name: 'District Court, Lucknow',
    party_name: 'Ram Kumar',
    opposite_party: 'State of UP',
    party_mobile: '9876543210',
    advocate_name: 'Adv. Sharma',
    status: 'Active',
  });
  const caseId = c1.body.data?.id;
  console.log('[2] Create case:', c1.status === 201 ? `✓ Created (id=${caseId})` : `✗ FAILED: ${JSON.stringify(c1.body)}`);

  // 3. Create a second case
  const c2 = await req('POST', '/api/cases', {
    case_number: 'CIVIL/002/2026',
    case_type: 'Civil',
    court_name: 'High Court, Allahabad',
    party_name: 'Sita Devi',
    opposite_party: 'Ram Prasad',
    party_mobile: '8765432109',
    status: 'Active',
  });
  const caseId2 = c2.body.data?.id;
  console.log('[3] Create case 2:', c2.status === 201 ? `✓ Created (id=${caseId2})` : `✗ FAILED`);

  // 4. Add today hearing to case 1
  const h1 = await req('POST', `/api/cases/${caseId}/hearings`, {
    hearing_date: today,
    purpose: 'Argument',
    court_remarks: 'Next date given',
  });
  console.log('[4] Add today hearing:', h1.status === 201 ? '✓ Added' : `✗ FAILED: ${JSON.stringify(h1.body)}`);

  // 5. Add tomorrow hearing to case 2
  const h2 = await req('POST', `/api/cases/${caseId2}/hearings`, {
    hearing_date: tomorrow,
    purpose: 'Evidence',
  });
  console.log('[5] Add tomorrow hearing:', h2.status === 201 ? '✓ Added' : `✗ FAILED`);

  // 6. Get all cases
  const cases = await req('GET', '/api/cases', null);
  console.log('[6] List cases:', cases.status === 200 ? `✓ ${cases.body.data.length} cases` : '✗ FAILED');

  // 7. Get dashboard
  const dash = await req('GET', '/api/dashboard', null);
  const stats = dash.body.data?.stats;
  console.log('[7] Dashboard:', dash.status === 200 ? `✓ total=${stats?.total_cases}, active=${stats?.active_cases}` : '✗ FAILED');
  console.log('    Today hearings:', dash.body.data?.today_hearings?.length ?? 'N/A');
  console.log('    Tomorrow hearings:', dash.body.data?.tomorrow_hearings?.length ?? 'N/A');

  // 8. Search
  const search = await req('GET', '/api/search?q=Ram', null);
  console.log('[8] Search "Ram":', search.status === 200 ? `✓ ${search.body.data.length} result(s)` : '✗ FAILED');

  // 9. Reminders
  const reminders = await req('GET', '/api/reminders', null);
  console.log('[9] Reminders:', reminders.status === 200 ? `✓ ${reminders.body.data.length} upcoming hearing(s)` : '✗ FAILED');
  if (reminders.body.data?.length) {
    console.log('    First reminder label:', reminders.body.data[0].label);
  }

  // 10. Get single case
  const single = await req('GET', `/api/cases/${caseId}`, null);
  console.log('[10] Get case:', single.status === 200 ? `✓ ${single.body.data.case_number}` : '✗ FAILED');

  // 11. Validation check (missing required fields)
  const bad = await req('POST', '/api/cases', { case_number: 'X' });
  console.log('[11] Validation:', bad.status === 422 ? '✓ 422 on missing fields' : `✗ Expected 422, got ${bad.status}`);

  // 12. Delete case
  const del = await req('DELETE', `/api/cases/${caseId}`, null);
  console.log('[12] Delete case:', del.status === 200 ? '✓ Deleted' : '✗ FAILED');

  console.log('\n=== Verification Complete ===\n');
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
