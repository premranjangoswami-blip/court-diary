export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-start gap-2 text-sm">
      <span className="text-red-500 text-base mt-0.5">⚠</span>
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold">✕</button>
      )}
    </div>
  );
}
