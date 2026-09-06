import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/api';
import { formatDateIN } from '../utils/dateUtils';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import CallPartyButton from '../components/CallPartyButton';

export default function Search() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const debounceRef = useRef(null);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setError('');
    try {
      const res = await searchApi.search(q.trim());
      setResults(res.data);
      setSearched(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    doSearch(query);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Search / खोज</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Search by case number, party name, mobile, court name, opposite party, or advocate.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input type="text" className="form-input pl-9"
            placeholder="Case no., party name, mobile, court, advocate..."
            value={query} onChange={handleChange} autoFocus />
        </div>
        <button type="submit" className="btn-primary px-5">Search</button>
      </form>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading && <Spinner text="Searching..." />}

      {/* Results */}
      {!loading && searched && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length === 0
              ? `No results found for "${query}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>

          {results.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-500 font-medium">No cases found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-navy-800 text-white">
                      <tr>
                        <th className="text-left px-3 py-3 font-semibold">Case No.</th>
                        <th className="text-left px-3 py-3 font-semibold">Type</th>
                        <th className="text-left px-3 py-3 font-semibold">Court</th>
                        <th className="text-left px-3 py-3 font-semibold">Party</th>
                        <th className="text-left px-3 py-3 font-semibold">Opposite</th>
                        <th className="text-left px-3 py-3 font-semibold">Advocate</th>
                        <th className="text-left px-3 py-3 font-semibold">Mobile</th>
                        <th className="text-left px-3 py-3 font-semibold">Next Hearing</th>
                        <th className="text-left px-3 py-3 font-semibold">Status</th>
                        <th className="text-left px-3 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.map((c) => (
                        <tr key={c.id} className="hover:bg-gold-50 transition-colors">
                          <td className="px-3 py-2.5">
                            <Link to={`/cases/${c.id}`}
                              className="font-semibold text-navy-800 hover:text-gold-600 whitespace-nowrap">
                              {c.case_number}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">{c.case_type}</td>
                          <td className="px-3 py-2.5 max-w-[130px]">
                            <div className="truncate text-gray-600" title={c.court_name}>{c.court_name}</div>
                          </td>
                          <td className="px-3 py-2.5 max-w-[120px]">
                            <div className="font-medium text-gray-800 truncate" title={c.party_name}>{c.party_name}</div>
                          </td>
                          <td className="px-3 py-2.5 max-w-[110px]">
                            <div className="truncate text-gray-500" title={c.opposite_party || ''}>{c.opposite_party || '—'}</div>
                          </td>
                          <td className="px-3 py-2.5 max-w-[110px]">
                            <div className="truncate text-gray-500" title={c.advocate_name || ''}>{c.advocate_name || '—'}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <CallPartyButton mobile={c.party_mobile} />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {c.next_hearing_date
                              ? <span className="font-semibold text-gold-700">{formatDateIN(c.next_hearing_date)}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <Link to={`/cases/${c.id}`} className="btn-secondary py-1 px-2 text-xs">View</Link>
                              <Link to={`/cases/${c.id}/edit`} className="btn-secondary py-1 px-2 text-xs">Edit</Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {results.map((c) => (
                  <div key={c.id} className="card border-l-4 border-navy-400">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/cases/${c.id}`} className="font-bold text-navy-800 hover:text-gold-600">
                            {c.case_number}
                          </Link>
                          <StatusBadge status={c.status} />
                          <span className="text-xs text-gray-400">{c.case_type}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 font-medium">{c.party_name}</p>
                        {c.opposite_party && <p className="text-xs text-gray-400">vs. {c.opposite_party}</p>}
                        <p className="text-xs text-gray-500 mt-1">🏛 {c.court_name}</p>
                        {c.advocate_name && <p className="text-xs text-gray-400">⚖ {c.advocate_name}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {c.next_hearing_date && (
                          <p className="text-xs font-bold text-gold-700">📅 {formatDateIN(c.next_hearing_date)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <CallPartyButton mobile={c.party_mobile} />
                      <Link to={`/cases/${c.id}`} className="btn-secondary text-xs">View Details</Link>
                      <Link to={`/cases/${c.id}/edit`} className="btn-secondary text-xs">Edit</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⚖️</p>
          <p className="text-gray-500 font-medium">Enter a search term above to find cases.</p>
          <p className="text-xs text-gray-400 mt-1">
            Search by case number, party name, mobile, court name, or advocate name.
          </p>
        </div>
      )}
    </div>
  );
}
