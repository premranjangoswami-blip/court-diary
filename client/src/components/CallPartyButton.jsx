import phoneService from '../services/phoneService';

/**
 * CallPartyButton — renders a tel: link that opens the device dialer.
 * Architecture is isolated via phoneService so future telephony
 * providers can be swapped in without touching this component.
 */
export default function CallPartyButton({ mobile, size = 'sm' }) {
  if (!mobile) return null;

  const uri = phoneService.getDialUri(mobile);

  const sizeClasses = size === 'lg'
    ? 'px-4 py-2 text-sm'
    : 'px-3 py-1.5 text-xs';

  return (
    <a
      href={uri}
      className={`inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors ${sizeClasses}`}
      title={`Call ${mobile}`}
      aria-label={`Call party ${mobile}`}
    >
      <PhoneIcon className="w-3.5 h-3.5" />
      <span>{phoneService.buttonLabel}</span>
      <span className="opacity-75">({mobile})</span>
    </a>
  );
}

function PhoneIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
