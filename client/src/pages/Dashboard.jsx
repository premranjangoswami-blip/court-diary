import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { formatDateIN, todayISO } from '../utils/dateUtils';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import CallPartyButton from '../components/CallPartyButton';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading dashboard..." />;
  if (error)   return <ErrorAlert message={error} onDismiss={() => setError('')} />;
  if (!data)   return null;

  const { stats, today_hearings, tomorrow_hearings, upcoming_hearings } = data;
  const todayFormatted = formatDateIN(todayISO());

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Dashboard / डैशबोर्ड</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}आज की तारीख: <span className="font-medium text-navy-700">{todayFormatted}</span>
          </p>
        </div>
        <Link to="/cases/new" className="btn-primary text-sm">+ New Case</Link>
      </div>

      {/* Today alert banner */}
      {today_hearings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔴</span>
          <div>
            <p className="font-bold text-red-700">
              {today_hearings.length} hearing{today_hearings.length > 1 ? 's' : ''} scheduled TODAY — {todayFormatted}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              आज {today_hearings.length} सुनवाई निर्धारित है।
            </p>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Cases" labelHi="कुल मुकदमे" value={stats.total_cases ?? 0}   icon="📁" color="navy" />
        <StatCard label="Active"      labelHi="सक्रिय"       value={stats.active_cases ?? 0}   icon="⚡" color="green" />
        <StatCard label="Disposed"    labelHi="निस्तारित"    value={stats.disposed_cases ?? 0} icon="✅" color="gray" />
        <StatCard label="Stayed"      labelHi="स्थगित"       value={stats.stayed_cases ?? 0}   icon="⏸" color="yellow" />
      </div>

      {/* ── Today ── */}
      <HearingSection
        title="Today's Hearings" titleHi="आज की सुनवाई"
        hearings={today_hearings} variant="today"
        emptyMsg="No hearings today. / आज कोई सुनवाई नहीं।"
      />

      {/* ── Tomorrow ── */}
      <HearingSection
        title="Tomorrow's Hearings" titleHi="कल की सुनवाई"
        hearings={tomorrow_hearings} variant="tomorrow"
        emptyMsg="No hearings tomorrow. / कल कोई सुनवाई नहीं।"
      />

      {/* ── Upcoming 7 days ── */}
      <HearingSection
        title="Upcoming — Next 7 Days" titleHi="आगामी — अगले 7 दिन"
        hearings={upcoming_hearings} variant="upcoming"
        emptyMsg="No upcoming hearings in the next 7 days."
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, labelHi, value, icon, color }) {
  const colors = {
    navy:   'bg-navy-800 text-white',
    green:  'bg-green-600 text-white',
    gray:   'bg-gray-500 text-white',
    yellow: 'bg-gold-500 text-white',
  };
  return (
    <div className="stat-card">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-navy-900">{value}</p>
        <p className="text-xs leading-tight text-gray-500">
          {label}<br /><span className="text-gray-400">{labelHi}</span>
        </p>
      </div>
    </div>
  );
}

function HearingSection({ title, titleHi, hearings, variant, emptyMsg }) {
  const accent = {
    today:    'text-red-700',
    tomorrow: 'text-gold-700',
    upcoming: 'text-navy-700',
  }[variant];
  const icon = variant === 'today' ? '🔴' : variant === 'tomorrow' ? '🟡' : '🔵';

  return (
    <div className="card">
      <div className={`flex items-center gap-2 mb-3 flex-wrap ${accent}`}>
        <span className="text-base">{icon}</span>
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs font-normal text-gray-400">/ {titleHi}</span>
        {hearings.length > 0 && (
          <span className="ml-auto text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
            {hearings.length}
          </span>
        )}
      </div>

      {hearings.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMsg}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Date / तारीख</th>
                <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Case No.</th>
                <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Party / Client</th>
                <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Court</th>
                <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Stage</th>
                <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Status</th>
                <th className="text-left pb-2 font-semibold whitespace-nowrap">Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hearings.map((h) => (
                <DashboardHearingRow key={h.id} hearing={h} variant={variant} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DashboardHearingRow({ hearing: h, variant }) {
  const rowBg = variant === 'today'
    ? 'bg-red-50/60'
    : variant === 'tomorrow'
    ? 'bg-gold-50/60'
    : '';

  return (
    <tr className={`${rowBg} hover:bg-navy-50/40 transition-colors`}>
      <td className="py-2 pr-3 font-semibold text-navy-800 whitespace-nowrap">
        {formatDateIN(h.hearing_date)}
      </td>
      <td className="py-2 pr-3">
        <Link to={`/cases/${h.case_id}`}
          className="font-medium text-navy-700 hover:text-gold-600 whitespace-nowrap">
          {h.case_number}
        </Link>
      </td>
      <td className="py-2 pr-3 max-w-[140px]">
        <div className="truncate font-medium text-gray-800" title={h.party_name}>{h.party_name}</div>
        {h.opposite_party && (
          <div className="truncate text-gray-400 text-xs" title={h.opposite_party}>
            vs. {h.opposite_party}
          </div>
        )}
      </td>
      <td className="py-2 pr-3 max-w-[130px]">
        <div className="truncate text-gray-600" title={h.court_name}>{h.court_name}</div>
      </td>
      <td className="py-2 pr-3">
        {h.purpose ? (
          <span className="bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded">{h.purpose}</span>
        ) : '—'}
      </td>
      <td className="py-2 pr-3">
        <StatusBadge status={h.case_status} />
      </td>
      <td className="py-2">
        <CallPartyButton mobile={h.party_mobile} />
      </td>
    </tr>
  );
}
