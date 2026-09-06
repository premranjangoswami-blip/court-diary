export default function StatusBadge({ status }) {
  const cls =
    status === 'Active'   ? 'badge-active'   :
    status === 'Disposed' ? 'badge-disposed' :
    status === 'Stayed'   ? 'badge-stayed'   :
    'badge-disposed';

  return <span className={cls}>{status}</span>;
}
