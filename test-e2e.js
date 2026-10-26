// test-e2e.js - Production Obfuscated Integration Test
import test from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { Window } from 'happy-dom';

// ---------------------------------------------------------------------------
// A. EMULATE BROWSER ENVIRONMENT FOR HARMLESS CLIENT-SIDE TESTING IN NODE
// ---------------------------------------------------------------------------
const dom = new Window({
  url: 'https://localhost:3000',
  settings: {
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }
});

Object.defineProperty(global, 'window', { value: dom, writable: true, configurable: true });
Object.defineProperty(global, 'navigator', { value: dom.navigator, writable: true, configurable: true });
Object.defineProperty(global, 'screen', { value: dom.screen, writable: true, configurable: true });
Object.defineProperty(global, 'document', { value: dom.document, writable: true, configurable: true });

global.window.HTMLCanvasElement.prototype.getContext = function() {
  return {
    fillRect: () => {},
    fillText: () => {},
    textBaseline: 'top',
    font: '12px Arial',
    fillStyle: '#000'
  };
};

// ---------------------------------------------------------------------------
// B. LOAD COMPILED MODULE ARTIFACTS (Validates exported functionality)
// ---------------------------------------------------------------------------
const { default: FingerprintIdProofing } = await import('./index.js');
const { FingerprintIdProofingVerifier } = await import('./backend.js');
const require = createRequire(import.meta.url);
const commonJsBackend = require('fingerprint-id-proofing/backend');

// ---------------------------------------------------------------------------
// C. PIPELINE INTEGRATION TEST
// ---------------------------------------------------------------------------
test('client generates a visitor ID offline and initializes one telemetry session', async () => {
  const mockDynamicKey = "39467c7518514b5391138855f642e05c";
  const requests = [];
  let rejectKeyExchange = true;
  global.fetch = async (...args) => {
    requests.push(args);
    if (rejectKeyExchange) return { ok: false, json: async () => ({}) };
    return {
      ok: true,
      json: async () => ({ dynamicCipherKey: mockDynamicKey })
    };
  };
  global.window.navigator.sendBeacon = () => true;

  await assert.rejects(FingerprintIdProofing.getSessionId(), /could not initialize a telemetry session/);
  rejectKeyExchange = false;

  const trackingVisitorId = FingerprintIdProofing.getVisitorId();
  assert.strictEqual(typeof trackingVisitorId, 'string');
  assert.match(trackingVisitorId, /^[0-9a-f]{32}$/, 'Visitor ID must be 32 lowercase hexadecimal characters.');
  assert.strictEqual(requests.length, 1, 'Visitor ID generation must not make network requests.');

  const [sessionId, sameSessionId] = await Promise.all([
    FingerprintIdProofing.getSessionId(),
    FingerprintIdProofing.getSessionId()
  ]);
  assert.match(sessionId, /^[0-9a-f-]{36}$/i);
  assert.strictEqual(sameSessionId, sessionId);
  assert.strictEqual(requests.length, 2, 'Concurrent calls must share one key exchange.');
  assert.strictEqual(requests[1][0], 'https://fingerprintidproofing.com/api/v1/get-session-key');
});

test('backend verifier sends credentials server-side and returns obligation on service failures', async () => {
  const verifier = new FingerprintIdProofingVerifier({ secretApiKey: ' test-secret ' });
  let request;
  global.fetch = async (...args) => {
    request = args;
    return { ok: true, json: async () => ({ policyDecision: 'approve' }) };
  };

  const result = await verifier.verifySessionScore(' session-1 ', ' User@Example.com ', ' vis_1 ');
  assert.strictEqual(result.policyDecision, 'approve');
  assert.strictEqual(request[1].headers.Authorization, 'Bearer test-secret');
  assert.deepStrictEqual(JSON.parse(request[1].body), {
    sessionId: 'session-1',
    userId: 'User@Example.com',
    visitorId: 'vis_1'
  });

  global.fetch = async () => ({ ok: false, status: 503 });
  const fallback = await verifier.verifySessionScore('session-1', 'user-1', 'vis_1');
  assert.strictEqual(fallback.policyDecision, 'obligation');
  assert.strictEqual(fallback.policyObligation, true);
  assert.strictEqual(fallback.sdkFallback, true);
  assert.strictEqual(fallback.errorCode, 'ASSESSMENT_UNAVAILABLE');
  assert.strictEqual(fallback.acquiredAttributes.calculatedVisitorId, 'vis_1');
  assert.ok(Object.values(fallback.userAssertionList[0].assertions).every((value) => value === 'unverified'));

  global.fetch = async () => ({ ok: false, status: 503 });
  const serverFailureFallback = await verifier.verifySessionScore('session-1', 'user-1', 'vis_1');
  assert.strictEqual(serverFailureFallback.policyDecision, 'obligation');

  global.fetch = async () => ({ ok: false, status: 401 });
  await assert.rejects(verifier.verifySessionScore('session-1', 'user-1', 'vis_1'), /status error: 401/);

  global.fetch = async () => ({ ok: true, json: async () => ({ policyDecision: 'unexpected' }) });
  await assert.rejects(verifier.verifySessionScore('session-1', 'user-1', 'vis_1'), /recognized policy decision/);

  await assert.rejects(verifier.verifySessionScore('', 'user-1', 'vis_1'), /Session ID/);
});

test('CommonJS backend export is constructable and preserves a deny decision', async () => {
  assert.strictEqual(typeof commonJsBackend, 'function');
  assert.strictEqual(typeof commonJsBackend.FingerprintIdProofingVerifier, 'function');
  const verifier = new commonJsBackend({ secretApiKey: 'test-secret' });
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ policyDecision: 'deny', errorCode: 'RISK_DENIED' })
  });

  const result = await verifier.verifySessionScore('session-1', 'user-1', 'visitor-1');
  assert.strictEqual(result.policyDecision, 'deny');
  assert.strictEqual(result.errorCode, 'RISK_DENIED');
  assert.notStrictEqual(result.sdkFallback, true);
});
