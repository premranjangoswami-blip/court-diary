import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { casesApi, hearingsApi } from '../services/api';
import { formatDateIN } from '../utils/dateUtils';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import CallPartyButton from '../components/CallPartyButton';
import HearingHistory from '../components/HearingHistory';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleteOpen, setDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCase = useCallback(async () => {
    try {
      const [cRes, hRes] = await Promise.all([
        casesApi.getById(id),
        hearingsApi.getForCase(id),
      ]);
      setCaseData(cRes.data);
      setHearings(hRes.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadCase(); }, [loadCase]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await casesApi.delete(id); navigate('/cases'); }
    catch (err) { setError(err.message); setDelete(false); }
    finally { setDeleting(false); }
  };

  if (loading) return <Spinner text="Loading case..." />;
  if (!caseData) return <ErrorAlert message={error || 'Case not found'} />;

  const c = caseData;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
        <Link to="/cases" className="hover:text-navy-700">Cases / मुकदमे</Link>
        <span>›</span>
        <span className="text-navy-700 font-medium">{c.case_number}</span>
      </nav>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* ── Case header card ── */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-navy-900">{c.case_number}</h1>
              <StatusBadge status={c.status} />
              {c.position && (
                <span className="bg-navy-100 text-navy-700 text-xs px-2 py-1 rounded font-medium">
                  {c.position}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{c.case_type} · {c.court_name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/cases/${id}/edit`} className="btn-secondary text-sm">✏ Edit / संपादन</Link>
            <button onClick={() => setDelete(true)} className="btn-danger text-sm">🗑 Delete / हटाएं</button>
          </div>
        </div>

        {/* Detail grid — diary layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          <DetailItem label="Case Number / वाद संख्या" value={c.case_number} highlight />
          <DetailItem label="Case Type / वाद प्रकार" value={c.case_type} />
          <DetailItem label="Court / न्यायालय" value={c.court_name} />
          <DetailItem label="GR Number / जीआर नंबर" value={c.gr_number} />
          <DetailItem label="Police Station / थाना" value={c.police_station} />
          <DetailItem label="Stage / पड़ाव" value={c.position} />
          <DetailItem label="Party / Client / मुवक्किल" value={c.party_name} highlight />
          <DetailItem label="Opposite Party / विपक्षी" value={c.opposite_party} />
          <DetailItem label="Advocate / अधिवक्ता" value={c.advocate_name} />
          <DetailItem label="Previous Date / पिछली तारीख" value={formatDateIN(c.previous_date)} />
          <DetailItem label="Next Hearing / अगली सुनवाई" value={formatDateIN(c.next_hearing_date)} highlight={!!c.next_hearing_date} />

          {/* Mobile — Call Party button */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1.5">
              Mobile / मोबाइल
            </p>
            {c.party_mobile
              ? <CallPartyButton mobile={c.party_mobile} size="lg" />
              : <p className="text-sm text-gray-400">—</p>
            }
          </div>
        </div>

        {c.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Notes / नोट्स</p>
            <p className="text-sm text-gray-600">{c.notes}</p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <span>Added: {formatDateIN(c.created_at?.slice(0, 10))}</span>
          <span>Updated: {formatDateIN(c.updated_at?.slice(0, 10))}</span>
          <span>{c.total_hearings ?? hearings.length} hearing(s)</span>
        </div>
      </div>

      {/* ── Hearing history ── */}
      <div className="card">
        <HearingHistory caseId={id} hearings={hearings} onRefresh={loadCase} />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Case / मुकदमा हटाएं?"
        message={`Delete case "${c.case_number}" and all ${hearings.length} hearing(s)? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDelete(false)}
      />
    </div>
  );
}

function DetailItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? 'font-bold text-navy-800' : 'text-gray-700'}`}>
        {value || '—'}
      </p>
    </div>
  );
}
