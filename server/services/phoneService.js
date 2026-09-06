/**
 * phoneService — abstraction layer for telephony.
 *
 * Current implementation: returns a `tel:` URI string that the
 * frontend renders as an anchor tag, safely opening the device dialer.
 *
 * Future: replace `dial()` with an API call to Twilio / Exotel / etc.
 * without touching any UI code.
 */

const phoneService = {
  /**
   * Returns the dial action descriptor for a given phone number.
   * @param {string} mobile - The phone number to dial.
   * @returns {{ type: 'tel', uri: string }}
   */
  dial(mobile) {
    if (!mobile) throw new Error('Mobile number is required');
    const cleaned = String(mobile).replace(/\s+/g, '');
    return {
      type: 'tel',
      uri: `tel:${cleaned}`,
    };
  },
};

module.exports = phoneService;
