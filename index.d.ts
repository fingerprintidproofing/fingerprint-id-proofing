// index.d.ts - TypeScript Definitions for FingerprintIdProofing Core Engine

export interface FingerprintIdProofingEngine {
  /**
  * Starts the asynchronous key exchange and telemetry request.
  * Telemetry is sent only when this method is called.
   * @returns A promise resolving to the active transaction session UUID string.
   */
  getSessionId(): Promise<string>;

  /**
  * Computes a browser visitor identifier locally without making a network request.
   * @returns A string representing the unique hardware visitor signature.
   */
  getVisitorId(): string;
}

// 1. Support for traditional Vanilla Script tag CDNs mapping globally onto window context
declare global {
  interface Window {
    FingerprintIdProofing: FingerprintIdProofingEngine;
  }
}

// 2. Support for modern JavaScript framework import module statements (Vite, Webpack, Angular)
declare const FingerprintIdProofing: FingerprintIdProofingEngine;
export default FingerprintIdProofing;
