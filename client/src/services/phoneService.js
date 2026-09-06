/**
 * Client-side phoneService — mirrors the server-side abstraction.
 *
 * dial(mobile) → returns a `tel:` URI.
 * Future: replace with an API call to trigger a scheduled call via
 * Twilio / Exotel without changing any component code.
 */
const phoneService = {
  /**
   * Returns the dial URI for a given mobile number.
   * Components use this to set `href` on an <a> tag.
   * @param {string} mobile
   * @returns {string}  e.g. "tel:+919876543210"
   */
  getDialUri(mobile) {
    if (!mobile) return '#';
    const cleaned = String(mobile).replace(/\s+/g, '');
    return `tel:${cleaned}`;
  },

  /**
   * Label shown on the call button.
   */
  buttonLabel: 'Call Party',
};

export default phoneService;
