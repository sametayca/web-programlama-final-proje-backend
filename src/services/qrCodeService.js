const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class QRCodeService {
  /**
   * Generate a unique QR code (UUID)
   * @returns {string} UUID string
   */
  generate() {
    const qrCode = uuidv4();
    logger.debug(`QR code generated: ${qrCode}`);
    return qrCode;
  }

  /**
   * Validate QR code format (must be valid UUID)
   * @param {string} qrCode
   * @returns {boolean}
   */
  isValidFormat(qrCode) {
    if (!qrCode || typeof qrCode !== 'string') {
      return false;
    }

    // UUID v4 format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(qrCode);
  }

  /**
   * Validate QR code and check if it matches expected value
   * @param {string} qrCode - QR code to validate
   * @param {string} expectedQRCode - Expected QR code
   * @returns {boolean}
   */
  validate(qrCode, expectedQRCode) {
    if (!this.isValidFormat(qrCode)) {
      logger.warn(`Invalid QR code format: ${qrCode}`);
      return false;
    }

    if (qrCode !== expectedQRCode) {
      logger.warn(`QR code mismatch: ${qrCode} !== ${expectedQRCode}`);
      return false;
    }

    return true;
  }
}

module.exports = new QRCodeService();

