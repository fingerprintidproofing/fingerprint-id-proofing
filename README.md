# Fingerprint ID Proofing: JavaScript Browser Fingerprinting SDK

[![npm version](https://img.shields.io/npm/v/fingerprint-id-proofing)](https://www.npmjs.com/package/fingerprint-id-proofing)
[![License](https://img.shields.io/npm/l/fingerprint-id-proofing)](https://www.npmjs.com/package/fingerprint-id-proofing)

`fingerprint-id-proofing` is a JavaScript and TypeScript SDK for browser visitor IDs, device signals, telemetry collection, identity proofing, and fraud risk workflows. Use the browser module to generate a local visitor ID or explicitly start a telemetry session, then use the server module to request an assessment.

## Install

```bash
npm install fingerprint-id-proofing
# or
yarn add fingerprint-id-proofing
# or
pnpm add fingerprint-id-proofing
```

## Browser Quick Start

The browser entry is an ES module. `getVisitorId()` computes a visitor ID locally and does not make a network request. `getSessionId()` starts the key exchange and sends browser telemetry to Fingerprint ID Proofing; await it and handle failures.

```js
import FingerprintIdProofing from 'fingerprint-id-proofing';

const visitorId = FingerprintIdProofing.getVisitorId();

try {
  const sessionId = await FingerprintIdProofing.getSessionId();
  await fetch('/api/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, sessionId })
  });
} catch (error) {
  // Apply your application's documented fallback or step-up policy.
  console.error('Device assessment is unavailable.');
}
```

Call these methods in a browser context, such as a client-side event or component effect. Do not treat a visitor ID as an authentication credential or proof of identity.

## Server-Side Assessment

Install the package on your server and keep the secret API key in a server-only environment variable. Never put the secret key in frontend code or a public build.

```js
import { FingerprintIdProofingVerifier } from 'fingerprint-id-proofing/backend';

const verifier = new FingerprintIdProofingVerifier({
  secretApiKey: process.env.FINGERPRINT_ID_PROOFING_SECRET
});

const assessment = await verifier.verifySessionScore(
  sessionId,
  userId,
  visitorId
);

if (assessment.policyDecision === 'obligation') {
  // Start MFA or route to manual review. Never grant access from an obligation.
  return res.status(202).json({
    decision: 'obligation',
    stepUpRequired: true,
    assessment
  });
}

if (assessment.policyDecision !== 'approve') {
  return res.status(403).json({ decision: 'deny', assessment });
}
```

The verifier sends the session ID, user ID, and visitor ID to the assessment API. Network errors, non-success HTTP responses, and malformed assessment responses return a conservative fallback with `policyDecision: "obligation"`, `policyObligation: true`, `sdkFallback: true`, and `errorCode: "ASSESSMENT_UNAVAILABLE"`. Signals in this fallback are marked `unverified`; it never grants approval. Route obligations to MFA or manual review. Invalid method inputs still reject with an error.

## Browser CDN

For a browser page without a bundler, load the package as an ES module. Pin the version you have tested before deploying.

```html
<script type="module">
  import FingerprintIdProofing from
    'https://unpkg.com/fingerprint-id-proofing@1.0.7/index.js';

  const visitorId = FingerprintIdProofing.getVisitorId();
  console.log(visitorId);
</script>
```

## Privacy and Security

- Browser telemetry is sent only when `getSessionId()` is called. Review the collected browser signals and obtain any consent required for your use case and jurisdiction.
- The client currently places telemetry parameters in the service's HTTPS request URL, as required by the existing service contract. URLs may be captured in service or proxy logs; moving this payload into a request body requires a matching server-side change. The payload's XOR representation is obfuscation, not cryptographic encryption; do not use it to protect secrets or sensitive application data.
- The visitor ID is derived from browser and device signals. It can change across browsers or device changes and can collide; use it as one risk signal, not as a sole access-control factor.
- Keep API secrets on your server, validate the assessment response, and choose an explicit fail-open or fail-closed policy for service outages.

## Package Details

- Browser entry: `fingerprint-id-proofing`
- Server verifier: `fingerprint-id-proofing/backend`
- TypeScript declarations are included for both entry points.
- Package license metadata: MIT.# fingerprint-npm
