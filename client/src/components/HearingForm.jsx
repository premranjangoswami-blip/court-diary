import { useState } from 'react';
import { hearingsApi } from '../services/api';
import ErrorAlert from './ErrorAlert';

/**
 * HearingForm — modal to add or edit a hearing.
 * Props:
 *   caseId      - required when adding
 *   hearing     - existing hearing object when editing
 *   onSaved(h)  - called with the saved hearing
 *   onClose()   - called to close the modal
 */
export default function HearingForm({ caseId, hearing, onSaved, onClose }) {
  const isEdit = !!hearing;

  const [form, setForm] = useState({
    hearing_date:  hearing?.hearing_date  || '',
    next_date:     hearing?.next_date     || '',
    purpose:       hearing?.purpose       || '',
    court_remarks: hearing?.court_remarks || '',
    outcome:       hearing?.outcome       || '',
    is_completed:  hearing?.is_completed === 1 || hearing?.is_completed === true || false,
  });

  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving]     = useState(false);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.hearing_date) errs.hearing_date = 'Hearing date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      let saved;
      if (isEdit) {
        const res = await hearingsApi.update(hearing.id, form);
        saved = res.data;
      } else {
        const res = await hearingsApi.addToCase(caseId, form);
        saved = res.data;
      }
      onSaved(saved);
    } catch (err) { setApiError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full z-10 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-navy-900">
            {isEdit ? 'Edit Hearing / सुनवाई संपादित करें' : 'Add Hearing / सुनवाई जोड़ें'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <ErrorAlert message={apiError} onDismiss={() => setApiError('')} />

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Hearing Date / सुनवाई तारीख *</label>
              <input type="date" className="form-input" value={form.hearing_date} onChange={set('hearing_date')} />
              {errors.hearing_date && <p className="form-error">{errors.hearing_date}</p>}
            </div>
            <div>
              <label className="form-label">Next Date / अगली तारीख</label>
              <input type="date" className="form-input" value={form.next_date} onChange={set('next_date')} />
              <p className="text-xs text-gray-400 mt-0.5">Next hearing date given by court</p>
            </div>
          </div>

          <div>
            <label className="form-label">Purpose / Stage / प्रयोजन / पड़ाव</label>
            <input type="text" className="form-input" value={form.purpose} onChange={set('purpose')}
              placeholder="e.g. Arguments, Evidence, Judgement, Bail" />
          </div>

          <div>
            <label className="form-label">Court Remarks / आदेश</label>
            <textarea className="form-input resize-none" rows={3} value={form.court_remarks}
              onChange={set('court_remarks')} placeholder="What the court ordered or said..." />
          </div>

          <div>
            <label className="form-label">Outcome / Notes / परिणाम</label>
            <textarea className="form-input resize-none" rows={2} value={form.outcome}
              onChange={set('outcome')} placeholder="What actually happened..." />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input id="is_completed" type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              checked={form.is_completed} onChange={set('is_completed')} />
            <label htmlFor="is_completed" className="text-sm font-medium text-navy-700">
              Mark as completed / पूर्ण के रूप में चिह्नित करें
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel / रद्द</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Hearing / अपडेट करें' : 'Add Hearing / जोड़ें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
