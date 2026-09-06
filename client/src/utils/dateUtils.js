/**
 * Format an ISO date string (YYYY-MM-DD) to "15 Mar 2024" (medium English).
 */
export function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format an ISO date string to Indian DD/MM/YYYY format.
 * e.g. "2024-03-15" → "15/03/2024"
 */
export function formatDateIN(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
export function todayISO() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Days from today until the given ISO date.
 * Negative = past, 0 = today, 1 = tomorrow, etc.
 */
export function daysUntil(isoStr) {
  if (!isoStr) return null;
  const today  = new Date(todayISO() + 'T00:00:00');
  const target = new Date(isoStr      + 'T00:00:00');
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a friendly label: "Today", "Tomorrow", "In 3 days", or formatted date.
 */
export function hearingLabel(isoStr) {
  const diff = daysUntil(isoStr);
  if (diff === null) return '—';
  if (diff === 0)    return 'Today';
  if (diff === 1)    return 'Tomorrow';
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  if (diff < 0)      return `${Math.abs(diff)} days ago`;
  return formatDateIN(isoStr);
}
