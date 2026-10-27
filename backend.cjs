'use strict';

class FingerprintIdProofingVerifier {
  constructor(options) {
    if (typeof options?.secretApiKey !== 'string' || !options.secretApiKey.trim()) {
      throw new Error('Missing structural credential configurations: secretApiKey is required.');
    }

    this.options = { secretApiKey: options.secretApiKey.trim() };
    this.verifierPromise = import('./backend.js').then(({ FingerprintIdProofingVerifier: Verifier }) =>
      new Verifier(this.options)
    );
  }

  // Keep CommonJS behavior aligned with the canonical ESM backend implementation.
  async verifySessionScore(sessionId, userId, visitorId) {
    const verifier = await this.verifierPromise;
    return verifier.verifySessionScore(sessionId, userId, visitorId);
  }
}

module.exports = FingerprintIdProofingVerifier;
module.exports.FingerprintIdProofingVerifier = FingerprintIdProofingVerifier;