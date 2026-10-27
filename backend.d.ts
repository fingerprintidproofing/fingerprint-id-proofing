export interface ThreatReport {
  errorCode?: string;
  errorDescription?: string;
  transaction_id?: string;
  userAttributes?: unknown[];
  acquiredAttributes?: {
    calculatedVisitorId?: string;
    profiledRiskScore?: number;
  };
  userAssertionList?: Array<{
    provider: string;
    serviceOffering: string;
    dateAsserted: string;
    assertions: Record<string, string>;
  }>;
  mbun?: string;
  policyObligation?: boolean;
  policyDecision: 'approve' | 'deny' | 'obligation';
  sdkFallback?: boolean;
  [key: string]: unknown;
}

export interface FallbackAssessment extends ThreatReport {
  errorCode: 'ASSESSMENT_UNAVAILABLE';
  errorDescription: string;
  policyObligation: true;
  policyDecision: 'obligation';
  sdkFallback: true;
}

export type AssessmentResult = ThreatReport | FallbackAssessment;

export class FingerprintIdProofingVerifier {
  constructor(options: { secretApiKey: string });
  /**
  * Returns a server decision or an obligation fallback for network, HTTP, or malformed-response errors.
  * Invalid method inputs reject with an Error.
   */
  verifySessionScore(sessionId: string, userId: string, visitorId: string): Promise<AssessmentResult>;
}
