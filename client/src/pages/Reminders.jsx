import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { remindersApi } from '../services/api';
import { formatDateIN } from '../utils/dateUtils';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import CallPartyButton from '../components/CallPartyButton';
import StatusBadge from '../components/StatusBadge';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    remindersApi.get()
      .then((res) => setReminders(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading reminders..." />;

  const today    = reminders.filter((r) => r.days_until === 0);
  const tomorrow = reminders.filter((r) => r.days_until === 1);
  const upcoming = reminders.filter((r) => r.days_until  > 1);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Reminders / रिमाइंडर</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Hearings in the next 7 days — {reminders.length} total
        </p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {reminders.length === 0 && !error && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-600 font-medium">No hearings in the next 7 days!</p>
          <p className="text-sm text-gray-400 mt-1">अगले 7 दिनों में कोई सुनवाई नहीं।</p>
        </div>
      )}

      {today.length > 0 && (
        <ReminderSection
          title="TODAY" titleHi="आज"
          items={today}
          icon="🔴"
          headerCls="text-red-600"
          borderCls="border-red-500"
          bgCls="bg-red-50 border border-red-100"
        />
      )}

      {tomorrow.length > 0 && (
        <ReminderSection
          title="TOMORROW" titleHi="कल"
          items={tomorrow}
          icon="🟡"
          headerCls="text-gold-600"
          borderCls="border-gold-500"
          bgCls="bg-gold-50 border border-gold-100"
        />
      )}

      {upcoming.length > 0 && (
        <ReminderSection
          title="UPCOMING (2–7 days)" titleHi="आगामी"
          items={upcoming}
          icon="🔵"
          headerCls="text-navy-700"
          borderCls="border-navy-400"
          bgCls="bg-navy-50 border border-navy-100"
        />
      )}
    </div>
  );
}

function ReminderSection({ title, titleHi, items, icon, headerCls, borderCls, bgCls }) {
  return (
    <div>
      <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${headerCls}`}>
        {icon} {title}
        <span className="font-normal text-gray-400 normal-case tracking-normal">/ {titleHi}</span>
        <span className="ml-auto bg-white border text-gray-700 text-xs px-2 py-0.5 rounded-full font-normal normal-case tracking-normal">
          {items.length} case{items.length !== 1 ? 's' : ''}
        </span>
      </h2>

      {/* Table layout for the diary feel */}
      <div className={`rounded-xl overflow-hidden ${bgCls}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b-2 ${borderCls} text-gray-600`}>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Date / तारीख</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">When</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Case No.</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Party</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Opposite</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Court</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Stage</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Call</th>
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {items.map((r) => (
                <ReminderRow key={r.hearing_id} reminder={r} borderCls={borderCls} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReminderRow({ reminder: r }) {
  return (
    <tr className="hover:bg-white/70 transition-colors bg-white/40">
      <td className="px-4 py-2.5 font-bold text-navy-900 whitespace-nowrap">
        {formatDateIN(r.hearing_date)}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <span className={`font-medium ${r.days_until === 0 ? 'text-red-600' : r.days_until === 1 ? 'text-gold-600' : 'text-navy-600'}`}>
          {r.label}
        </span>
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <Link to={`/cases/${r.case_id}`}
          className="font-semibold text-navy-800 hover:text-gold-600">
          {r.case_number}
        </Link>
      </td>
      <td className="px-4 py-2.5 max-w-[120px]">
        <div className="truncate font-medium text-gray-800" title={r.party_name}>{r.party_name}</div>
      </td>
      <td className="px-4 py-2.5 max-w-[110px]">
        <div className="truncate text-gray-600" title={r.opposite_party || ''}>{r.opposite_party || '—'}</div>
      </td>
      <td className="px-4 py-2.5 max-w-[130px]">
        <div className="truncate text-gray-600" title={r.court_name}>{r.court_name}</div>
      </td>
      <td className="px-4 py-2.5">
        {r.purpose ? (
          <span className="bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded whitespace-nowrap">{r.purpose}</span>
        ) : '—'}
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={r.case_status} />
      </td>
      <td className="px-4 py-2.5">
        <CallPartyButton mobile={r.party_mobile} />
      </td>
      <td className="px-4 py-2.5">
        <Link to={`/cases/${r.case_id}`} className="btn-secondary text-xs py-1 px-2 whitespace-nowrap">
          View Case
        </Link>
      </td>
    </tr>
  );
}
