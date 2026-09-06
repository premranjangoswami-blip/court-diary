import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesApi } from '../services/api';
import { formatDateIN, todayISO } from '../utils/dateUtils';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import CallPartyButton from '../components/CallPartyButton';

/**
 * Hearings page — shows all upcoming (incomplete) hearings across all cases,
 * sorted by hearing date ascending. Mimics a paper court diary.
 */
export default function Hearings() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('upcoming'); // upcoming | all | today
  const today = todayISO();

  useEffect(() => {
    // Load all cases with next_hearing_date; then load hearings for all of them
    // More efficient: we hit /api/cases (which includes next_hearing_date) and
    // separately fetch /api/reminders for the 7-day view, plus a full hearings
    // roll-up from the cases list + individual hearing calls is expensive.
    // Instead we use a dedicated aggregation approach below.
    loadAll();
  }, []); // eslint-disable-line

  async function loadAll() {
    setLoading(true);
    try {
      // Fetch all active cases
      const casesRes = await casesApi.getAll({ status: 'Active' });
      const cases = casesRes.data;

      // Fetch hearings for each case in parallel (batched)
      const BATCH = 10;
      const allHearings = [];
      for (let i = 0; i < cases.length; i += BATCH) {
        const batch = cases.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map((c) =>
            fetch(`/api/cases/${c.id}/hearings`)
              .then((r) => r.json())
              .then((j) => (j.data || []).map((h) => ({ ...h, _case: c })))
              .catch(() => [])
          )
        );
        results.forEach((r) => allHearings.push(...r));
      }

      // Sort by hearing_date ASC, then case_number
      allHearings.sort((a, b) => {
        const d = a.hearing_date.localeCompare(b.hearing_date);
        if (d !== 0) return d;
        return a._case.case_number.localeCompare(b._case.case_number);
      });

      setRows(allHearings);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const filtered = rows.filter((h) => {
    if (filter === 'upcoming') return !h.is_completed && h.hearing_date >= today;
    if (filter === 'today')    return h.hearing_date === today;
    return true; // all
  });

  const upcomingCount = rows.filter((h) => !h.is_completed && h.hearing_date >= today).length;
  const todayCount    = rows.filter((h) => h.hearing_date === today).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Hearings / सुनवाई सूची</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All upcoming hearings across active cases — diary view
          </p>
        </div>
        <Link to="/cases/new" className="btn-primary text-sm">+ New Case</Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
          { key: 'today',    label: `Today (${todayCount})` },
          { key: 'all',      label: `All (${rows.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-navy-800 text-white'
                : 'bg-white text-navy-700 border border-gray-200 hover:bg-navy-50'
            }`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <Spinner text="Loading hearings..." />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 font-medium">No hearings found</p>
          {filter === 'today' && <p className="text-sm text-gray-400 mt-1">No hearings scheduled for today.</p>}
          {filter === 'upcoming' && <p className="text-sm text-gray-400 mt-1">No upcoming hearings.</p>}
        </div>
      ) : (
        <>
          {/* Desktop diary table */}
          <div className="hidden md:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    <th className="text-left px-3 py-3 font-semibold">#</th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Date / तारीख
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Case No. / वाद सं.
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Court / न्यायालय
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Party / मुवक्किल
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Opposite / विपक्षी
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Advocate / अधिवक्ता
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Stage / पड़ाव
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Next Date / अगली
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                      Call
                    </th>
                    <th className="text-left px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((h, idx) => {
                    const isToday    = h.hearing_date === today;
                    const isPast     = h.hearing_date < today;
                    const rowBg = isToday
                      ? 'bg-red-50'
                      : isPast
                      ? 'bg-gray-50 text-gray-400'
                      : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30';

                    return (
                      <tr key={h.id} className={`${rowBg} hover:bg-gold-50/60 transition-colors`}>
                        <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-semibold text-navy-800 whitespace-nowrap">
                          {formatDateIN(h.hearing_date)}
                          {isToday && (
                            <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">Today</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link to={`/cases/${h._case.id}`}
                            className="font-semibold text-navy-800 hover:text-gold-600 whitespace-nowrap">
                            {h._case.case_number}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 max-w-[130px]">
                          <div className="truncate text-gray-700" title={h._case.court_name}>
                            {h._case.court_name}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 max-w-[120px]">
                          <div className="font-medium text-gray-800 truncate" title={h._case.party_name}>
                            {h._case.party_name}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 max-w-[110px]">
                          <div className="truncate text-gray-500" title={h._case.opposite_party || ''}>
                            {h._case.opposite_party || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 max-w-[110px]">
                          <div className="truncate text-gray-500" title={h._case.advocate_name || ''}>
                            {h._case.advocate_name || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {h.purpose ? (
                            <span className="bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {h.purpose}
                            </span>
                          ) : (h._case.position ? (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {h._case.position}
                            </span>
                          ) : '—')}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {h.next_date ? (
                            <span className="font-semibold text-gold-700">{formatDateIN(h.next_date)}</span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={h._case.status} />
                        </td>
                        <td className="px-3 py-2.5">
                          <CallPartyButton mobile={h._case.party_mobile} />
                        </td>
                        <td className="px-3 py-2.5">
                          <Link to={`/cases/${h._case.id}`}
                            className="btn-secondary text-xs py-1 px-2 whitespace-nowrap">
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.map((h) => {
              const isToday = h.hearing_date === today;
              return (
                <div key={h.id}
                  className={`card border-l-4 ${isToday ? 'border-red-500 bg-red-50' : 'border-gold-400'}`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${isToday ? 'text-red-700' : 'text-navy-800'}`}>
                          {formatDateIN(h.hearing_date)}
                          {isToday && <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">Today</span>}
                        </span>
                        <Link to={`/cases/${h._case.id}`}
                          className="font-semibold text-navy-700 hover:text-gold-600 text-sm">
                          {h._case.case_number}
                        </Link>
                        <StatusBadge status={h._case.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1">{h._case.party_name}</p>
                      {h._case.opposite_party && <p className="text-xs text-gray-500">vs. {h._case.opposite_party}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">🏛 {h._case.court_name}</p>
                      {h.purpose && (
                        <span className="inline-block mt-1 bg-navy-100 text-navy-700 text-xs px-2 py-0.5 rounded">
                          {h.purpose}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {h.next_date && (
                        <p className="text-xs font-bold text-gold-700">Next: {formatDateIN(h.next_date)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <CallPartyButton mobile={h._case.party_mobile} />
                    <Link to={`/cases/${h._case.id}`} className="btn-secondary text-xs">View Case</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
