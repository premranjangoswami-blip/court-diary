/**
 * Simple modal confirmation dialog.
 * Usage: <ConfirmDialog open={open} title="Delete?" message="..." onConfirm={fn} onCancel={fn} />
 */
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 z-10">
        <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
