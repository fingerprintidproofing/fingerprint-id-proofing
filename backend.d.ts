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
  policyDecision?: 'approve' | 'deny' | 'obligation';
  sdkFallback?: boolean;
  [key: string]: unknown;
}

export class FingerprintIdProofingVerifier {
  constructor(options: { secretApiKey: string });
  verifySessionScore(sessionId: string, userId: string, visitorId: string): Promise<ThreatReport>;
}
