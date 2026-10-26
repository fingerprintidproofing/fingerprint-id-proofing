// backend.js - Developer SDK Integration Client (Pure JavaScript)

function createUnavailableAssessment(sessionId, visitorId) {
  const unverifiedAssertions = {
    "detect.bot": "unverified",
    "detect.torNode": "unverified",
    "detect.proxyTorVPN": "unverified",
    "detect.browserAnomalyCheck": "unverified",
    "detect.proxyGEOMismatch": "unverified",
    "detect.sessionCloaking": "unverified",
    "detect.apSessionIDNotReplay": "unverified",
    "test.trustedDevice": "unverified",
    "test.trustedDevice28days": "unverified",
    "test.gte5Device1d": "unverified"
  };

  return {
    errorCode: "ASSESSMENT_UNAVAILABLE",
    errorDescription: "Assessment could not be completed. Require step-up verification or manual review.",
    transaction_id: sessionId,
    userAttributes: [],
    acquiredAttributes: { calculatedVisitorId: visitorId },
    userAssertionList: [{
      provider: "FingerprintIdProofing",
      serviceOffering: "Advanced Risk Telemetry Engine",
      dateAsserted: new Date().toISOString(),
      assertions: unverifiedAssertions
    }],
    mbun: sessionId,
    policyObligation: true,
    policyDecision: "obligation",
    sdkFallback: true
  };
}

export class FingerprintIdProofingVerifier {
  constructor(options) {
    if (typeof options?.secretApiKey !== 'string' || !options.secretApiKey.trim()) {
      throw new Error("Missing structural credential configurations: secretApiKey is required.");
    }
    this.apiKey = options.secretApiKey.trim();
    // 💥 DIRECT API PORT SUBSURFACE PATH ENFORCEMENT
    this.verificationApiUrl = "https://fingerprintidproofing.com/api/v1/verify-assessment";
  }

  /**
   * Queries your central SaaS server to read the final computed identity validation report.
   * @param {string} sessionId - The tracking session token reference forwarded by their frontend UI.
   * @param {string} userId - The unique identifier of the user (e.g. Email/Username) to execute device trust lookups.
   * @param {string} visitorId - The unique hardware signature token passed by their frontend UI to intercept replay hacks.
   * @returns {Promise<Object>} Complete enterprise token report payload matching the ID Dataweb structure.
   */
  async verifySessionScore(sessionId, userId, visitorId) {
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      throw new Error("A valid string Session ID mapping reference must be specified.");
    }
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new Error("A valid tracking User ID reference must be provided to run device trust lookups.");
    }
    if (typeof visitorId !== 'string' || !visitorId.trim()) {
      throw new Error("A valid unique hardware Visitor ID signature vector must be specified for interlocking checks.");
    }

    let response;
    try {
      response = await fetch(this.verificationApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        // 💥 PASS ALL THREE TO THE SECURE VERIFICATION INGESTION ENGINE
        body: JSON.stringify({ 
          sessionId: sessionId.trim(),
          userId: userId.trim(),
          visitorId: visitorId.trim()
        })
      });
    } catch (error) {
      return createUnavailableAssessment(sessionId.trim(), visitorId.trim());
    }

    if (response.status >= 500) {
      return createUnavailableAssessment(sessionId.trim(), visitorId.trim());
    }
    if (!response.ok) {
      throw new Error(`Your security engine verification endpoint returned status error: ${response.status}`);
    }

    const assessment = await response.json();
    if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment) ||
        !['approve', 'deny', 'obligation'].includes(assessment.policyDecision)) {
      throw new Error('Assessment response did not include a recognized policy decision.');
    }

    return assessment;
  }
}
