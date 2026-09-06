import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { casesApi } from '../services/api';
import { formatDateIN } from '../utils/dateUtils';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import CallPartyButton from '../components/CallPartyButton';

const STATUS_TABS = ['All', 'Active', 'Disposed', 'Stayed'];

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [deleteTarget, setDelete] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {};
      const res = await casesApi.getAll(params);
      setCases(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await casesApi.delete(deleteTarget.id);
      setDelete(null);
      load();
    } catch (err) { setError(err.message); setDelete(null); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Cases / मुकदमे</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cases.length} case{cases.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/cases/new" className="btn-primary">+ New Case / नया मुकदमा</Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-navy-800 text-white'
                : 'bg-white text-navy-700 border border-gray-200 hover:bg-navy-50'
            }`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <Spinner text="Loading cases..." />
      ) : cases.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-500 font-medium">No cases found</p>
          <Link to="/cases/new" className="btn-primary inline-block mt-4">+ Add First Case</Link>
        </div>
      ) : (
        <>
          {/* ── Desktop diary-style table ── */}
          <div className="hidden lg:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">#</th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Case No.<br /><span className="font-normal opacity-70">वाद संख्या</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Court<br /><span className="font-normal opacity-70">न्यायालय</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Type<br /><span className="font-normal opacity-70">प्रकार</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">GR No.<br /><span className="font-normal opacity-70">जीआर</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Party / Client<br /><span className="font-normal opacity-70">मुवक्किल</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Opposite<br /><span className="font-normal opacity-70">विपक्षी</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Advocate<br /><span className="font-normal opacity-70">अधिवक्ता</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Mobile<br /><span className="font-normal opacity-70">मोबाइल</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Police Station<br /><span className="font-normal opacity-70">थाना</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Stage<br /><span className="font-normal opacity-70">पड़ाव</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Prev Date<br /><span className="font-normal opacity-70">पिछली</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Next Date<br /><span className="font-normal opacity-70">अगली तारीख</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Status<br /><span className="font-normal opacity-70">स्थिति</span></th>
                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cases.map((c, idx) => (
                    <tr key={c.id} className={`hover:bg-gold-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <Link to={`/cases/${c.id}`}
                          className="font-semibold text-navy-800 hover:text-gold-600 whitespace-nowrap">
                          {c.case_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 max-w-[140px]">
                        <div className="truncate" title={c.court_name}>{c.court_name}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{c.case_type}</td>
                      <td className="px-3 py-2.5 text-gray-600">{c.gr_number || '—'}</td>
                      <td className="px-3 py-2.5 max-w-[130px]">
                        <div className="font-medium text-gray-800 truncate" title={c.party_name}>{c.party_name}</div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[120px]">
                        <div className="text-gray-600 truncate" title={c.opposite_party || ''}>{c.opposite_party || '—'}</div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[120px]">
                        <div className="text-gray-600 truncate" title={c.advocate_name || ''}>{c.advocate_name || '—'}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {c.party_mobile ? (
                          <a href={`tel:${c.party_mobile}`}
                            className="text-green-700 font-medium hover:underline flex items-center gap-1">
                            <span>📞</span>{c.party_mobile}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[110px]">
                        <div className="truncate" title={c.police_station || ''}>{c.police_station || '—'}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        {c.position ? (
                          <span className="bg-navy-100 text-navy-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">{c.position}</span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        {formatDateIN(c.previous_date)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {c.next_hearing_date ? (
                          <span className="font-semibold text-gold-700">{formatDateIN(c.next_hearing_date)}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 whitespace-nowrap">
                          <Link to={`/cases/${c.id}`} className="btn-secondary py-1 px-2 text-xs">View</Link>
                          <Link to={`/cases/${c.id}/edit`} className="btn-secondary py-1 px-2 text-xs">Edit</Link>
                          <button onClick={() => setDelete(c)} className="btn-danger py-1 px-2 text-xs">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile / tablet card list ── */}
          <div className="lg:hidden space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="card border-l-4 border-navy-400">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/cases/${c.id}`} className="font-bold text-navy-800 hover:text-gold-600 text-sm">
                        {c.case_number}
                      </Link>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{c.case_type} · {c.court_name}</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{c.party_name}</p>
                    {c.opposite_party && <p className="text-xs text-gray-500">vs. {c.opposite_party}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                      {c.advocate_name && <span>⚖ {c.advocate_name}</span>}
                      {c.police_station && <span>🏠 {c.police_station}</span>}
                      {c.gr_number && <span>GR: {c.gr_number}</span>}
                    </div>
                    {c.position && (
                      <span className="inline-block mt-1.5 bg-navy-100 text-navy-700 text-xs px-2 py-0.5 rounded">
                        {c.position}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.next_hearing_date && (
                      <p className="text-xs font-bold text-gold-700">📅 {formatDateIN(c.next_hearing_date)}</p>
                    )}
                    {c.previous_date && (
                      <p className="text-xs text-gray-400">Prev: {formatDateIN(c.previous_date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 gap-2">
                  <CallPartyButton mobile={c.party_mobile} />
                  <div className="flex gap-2">
                    <Link to={`/cases/${c.id}`} className="btn-secondary text-xs py-1 px-2">View</Link>
                    <Link to={`/cases/${c.id}/edit`} className="btn-secondary text-xs py-1 px-2">Edit</Link>
                    <button onClick={() => setDelete(c)} className="btn-danger text-xs py-1 px-2">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Case / मुकदमा हटाएं?"
        message={`Delete case "${deleteTarget?.case_number}"? All hearings will be deleted too.`}
        onConfirm={handleDelete}
        onCancel={() => setDelete(null)}
      />
    </div>
  );
}
