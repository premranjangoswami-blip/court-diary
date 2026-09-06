import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { casesApi } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import Spinner from '../components/Spinner';

const CASE_TYPES = [
  'Criminal', 'Civil', 'Family', 'Revenue', 'Labour',
  'Consumer', 'Motor Accident', 'NDPS', 'Sessions', 'Other',
];
const STATUS_OPTIONS = ['Active', 'Disposed', 'Stayed'];
const POSITION_OPTIONS = [
  'Arguments', 'Evidence', 'Judgement', 'Framing of Charges',
  'Bail Application', 'Stay Application', 'Summons', 'Notice',
  'Cross Examination', 'Final Arguments', 'Awaiting Date', 'Other',
];

const EMPTY = {
  case_number:    '',
  case_type:      '',
  court_name:     '',
  police_station: '',
  gr_number:      '',
  party_name:     '',
  opposite_party: '',
  party_mobile:   '',
  advocate_name:  '',
  status:         'Active',
  previous_date:  '',
  position:       '',
  notes:          '',
};

export default function AddEditCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm]       = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    casesApi.getById(id)
      .then((res) => {
        const c = res.data;
        setForm({
          case_number:    c.case_number    || '',
          case_type:      c.case_type      || '',
          court_name:     c.court_name     || '',
          police_station: c.police_station || '',
          gr_number:      c.gr_number      || '',
          party_name:     c.party_name     || '',
          opposite_party: c.opposite_party || '',
          party_mobile:   c.party_mobile   || '',
          advocate_name:  c.advocate_name  || '',
          status:         c.status         || 'Active',
          previous_date:  c.previous_date  || '',
          position:       c.position       || '',
          notes:          c.notes          || '',
        });
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.case_number.trim())  errs.case_number = 'Case number is required';
    if (!form.case_type.trim())    errs.case_type   = 'Case type is required';
    if (!form.court_name.trim())   errs.court_name  = 'Court name is required';
    if (!form.party_name.trim())   errs.party_name  = 'Party/client name is required';
    if (form.party_mobile && !/^[0-9+\-\s()]{7,15}$/.test(form.party_mobile))
      errs.party_mobile = 'Invalid mobile number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      if (isEdit) {
        await casesApi.update(id, form);
        navigate(`/cases/${id}`);
      } else {
        const res = await casesApi.create(form);
        navigate(`/cases/${res.data.id}`);
      }
    } catch (err) { setApiError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner text="Loading case..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link to="/cases" className="hover:text-navy-700">Cases / मुकदमे</Link>
        <span>›</span>
        <span className="text-navy-700 font-medium">
          {isEdit ? 'Edit Case / संपादन' : 'New Case / नया मुकदमा'}
        </span>
      </nav>

      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">⚖️</span>
          <div>
            <h1 className="text-xl font-bold text-navy-900">
              {isEdit ? 'Edit Case / मुकदमा संपादित करें' : 'New Case / नया मुकदमा दर्ज करें'}
            </h1>
            <p className="text-xs text-gray-400">Fields marked * are required / * अनिवार्य फ़ील्ड</p>
          </div>
        </div>

        <ErrorAlert message={apiError} onDismiss={() => setApiError('')} />

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ── Section 1: Case Identification ── */}
          <Section title="Case Details / मुकदमे की जानकारी">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field label="Case Number / वाद संख्या *" error={errors.case_number}>
                <input type="text" className="form-input" value={form.case_number}
                  onChange={set('case_number')} placeholder="e.g. CC/123/2024" />
              </Field>

              <Field label="Case Type / वाद प्रकार *" error={errors.case_type}>
                <select className="form-select" value={form.case_type} onChange={set('case_type')}>
                  <option value="">— Select / चुनें —</option>
                  {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Court Name / न्यायालय *" error={errors.court_name}>
                <input type="text" className="form-input" value={form.court_name}
                  onChange={set('court_name')} placeholder="e.g. District Court, Lucknow" />
              </Field>

              <Field label="GR Number / जीआर नंबर">
                <input type="text" className="form-input" value={form.gr_number}
                  onChange={set('gr_number')} placeholder="Optional" />
              </Field>

              <Field label="Police Station / थाना">
                <input type="text" className="form-input" value={form.police_station}
                  onChange={set('police_station')} placeholder="Optional" />
              </Field>

              <Field label="Status / स्थिति">
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Previous Date / पिछली तारीख">
                <input type="date" className="form-input" value={form.previous_date}
                  onChange={set('previous_date')} />
              </Field>

              <Field label="Position / Stage / स्थिति / पड़ाव">
                <select className="form-select" value={form.position} onChange={set('position')}>
                  <option value="">— Select / चुनें —</option>
                  {POSITION_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>

            </div>
          </Section>

          {/* ── Section 2: Party Details ── */}
          <Section title="Party Details / पक्षकार की जानकारी">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field label="Party / Client Name / मुवक्किल का नाम *" error={errors.party_name}>
                <input type="text" className="form-input" value={form.party_name}
                  onChange={set('party_name')} placeholder="Full name" />
              </Field>

              <Field label="Opposite Party / विपक्षी पक्ष">
                <input type="text" className="form-input" value={form.opposite_party}
                  onChange={set('opposite_party')} placeholder="Optional" />
              </Field>

              <Field label="Mobile Number / मोबाइल नंबर" error={errors.party_mobile}>
                <input type="tel" className="form-input" value={form.party_mobile}
                  onChange={set('party_mobile')} placeholder="e.g. 9876543210" />
              </Field>

              <Field label="Advocate Name / अधिवक्ता">
                <input type="text" className="form-input" value={form.advocate_name}
                  onChange={set('advocate_name')} placeholder="Optional" />
              </Field>

            </div>
          </Section>

          {/* ── Section 3: Notes ── */}
          <Section title="Notes / नोट्स">
            <textarea className="form-input resize-none" rows={3} value={form.notes}
              onChange={set('notes')} placeholder="Any additional notes..." />
          </Section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link to={isEdit ? `/cases/${id}` : '/cases'} className="btn-secondary">
              Cancel / रद्द करें
            </Link>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Case / अपडेट करें' : 'Create Case / सहेजें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-navy-600 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
