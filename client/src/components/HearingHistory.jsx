import { useState } from 'react';
import { hearingsApi } from '../services/api';
import { formatDateIN } from '../utils/dateUtils';
import HearingForm from './HearingForm';
import ConfirmDialog from './ConfirmDialog';
import ErrorAlert from './ErrorAlert';

export default function HearingHistory({ caseId, hearings, onRefresh }) {
  const [showForm, setShowForm]       = useState(false);
  const [editHearing, setEditHearing] = useState(null);
  const [deleteTarget, setDelete]     = useState(null);
  const [error, setError]             = useState('');

  const handleSaved = () => { setShowForm(false); setEditHearing(null); onRefresh(); };

  const handleDelete = async () => {
    try { await hearingsApi.delete(deleteTarget.id); setDelete(null); onRefresh(); }
    catch (err) { setError(err.message); setDelete(null); }
  };

  const upcoming = hearings.filter((h) => !h.is_completed)
    .sort((a, b) => a.hearing_date.localeCompare(b.hearing_date));
  const past = hearings.filter((h) => h.is_completed)
    .sort((a, b) => b.hearing_date.localeCompare(a.hearing_date));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-navy-900">
          Hearings / सुनवाई ({hearings.length})
        </h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          + Add Hearing / सुनवाई जोड़ें
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {hearings.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No hearings recorded yet. Click "Add Hearing" to add one.
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-navy-500 uppercase tracking-wide mb-2">
            Upcoming / आगामी ({upcoming.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gold-50 text-gold-800">
                  <th className="text-left px-3 py-2 font-semibold">Date / तारीख</th>
                  <th className="text-left px-3 py-2 font-semibold">Stage / पड़ाव</th>
                  <th className="text-left px-3 py-2 font-semibold">Next Date / अगली</th>
                  <th className="text-left px-3 py-2 font-semibold">Remarks / आदेश</th>
                  <th className="text-left px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcoming.map((h) => (
                  <HearingRow key={h.id} hearing={h}
                    onEdit={() => setEditHearing(h)} onDelete={() => setDelete(h)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold text-navy-500 uppercase tracking-wide mb-2">
            History / इतिहास ({past.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left px-3 py-2 font-semibold">Date / तारीख</th>
                  <th className="text-left px-3 py-2 font-semibold">Stage / पड़ाव</th>
                  <th className="text-left px-3 py-2 font-semibold">Next Date / अगली</th>
                  <th className="text-left px-3 py-2 font-semibold">Remarks / आदेश</th>
                  <th className="text-left px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {past.map((h) => (
                  <HearingRow key={h.id} hearing={h}
                    onEdit={() => setEditHearing(h)} onDelete={() => setDelete(h)} completed />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {(showForm || editHearing) && (
        <HearingForm
          caseId={caseId}
          hearing={editHearing || undefined}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditHearing(null); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Hearing / सुनवाई हटाएं?"
        message={`Delete hearing on ${deleteTarget ? formatDateIN(deleteTarget.hearing_date) : ''}?`}
        onConfirm={handleDelete}
        onCancel={() => setDelete(null)}
      />
    </div>
  );
}

function HearingRow({ hearing: h, onEdit, onDelete, completed }) {
  return (
    <tr className={`${completed ? 'bg-white text-gray-500' : 'bg-white hover:bg-gold-50'} transition-colors`}>
      <td className="px-3 py-2.5 whitespace-nowrap font-medium">
        {formatDateIN(h.hearing_date)}
        {completed && <span className="ml-1.5 text-green-600 text-xs">✓</span>}
      </td>
      <td className="px-3 py-2.5">
        {h.purpose ? (
          <span className="bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded">{h.purpose}</span>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        {h.next_date ? (
          <span className="font-semibold text-gold-700">{formatDateIN(h.next_date)}</span>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5 max-w-[220px]">
        {h.court_remarks ? (
          <span className="truncate block" title={h.court_remarks}>{h.court_remarks}</span>
        ) : (h.outcome || '—')}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1">
          <button onClick={onEdit} className="btn-secondary text-xs py-1 px-2">Edit</button>
          <button onClick={onDelete} className="btn-danger text-xs py-1 px-2">Del</button>
        </div>
      </td>
    </tr>
  );
}
