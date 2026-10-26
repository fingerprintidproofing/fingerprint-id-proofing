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

The browser entry is an ES module. `getVisitorId()` computes a visitor ID locally and does not make a network request. Importing the SDK alone does not send telemetry: call `getSessionId()` once as early as your page bootstrap or `DOMContentLoaded` to start the key exchange and dispatch telemetry in the background. Do not wait until the user clicks the login button. Keep the returned promise and use its session ID in your login request. The session promise confirms telemetry dispatch; your server performs the risk assessment separately with `verifySessionScore()`.

```js
import FingerprintIdProofing from 'fingerprint-id-proofing';

const visitorId = FingerprintIdProofing.getVisitorId(); //Return visitorId

//When needed full riskscore assesment then use sessionIdPromise 
const sessionIdPromise = FingerprintIdProofing.getSessionId().catch(() => null);

//Example add session id and visiterId in signIn payload
async function signIn(credentials) {
  try {
    const sessionId = await sessionIdPromise;
    if (!sessionId) throw new Error('Telemetry session unavailable');

    await fetch('/api/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials, visitorId, sessionId })
    });
  } catch (error) {
    // Apply your application's documented fallback or step-up policy.
    console.error('Device assessment is unavailable.');
  }
}
```

In frameworks, start the session from a client-side bootstrap or mount effect. Do not treat a visitor ID as an authentication credential or proof of identity.


## Browser CDN

The CDN build provides the same browser SDK as the npm import. The `@1.0` version range resolves to the latest published `1.0.x` patch; it will not automatically move to a new minor or major version. CDN caching can delay when a new patch is served. Start the telemetry session during page bootstrap, then append both IDs to your existing sign-in request. Risk assessment and API-key use remain on your server; do not call the assessment API directly from this browser code.

```html
<script type="module">
  import FingerprintIdProofing from
    'https://unpkg.com/fingerprint-id-proofing@1.0/index.js';

  const visitorId = FingerprintIdProofing.getVisitorId();
  const sessionIdPromise = FingerprintIdProofing.getSessionId().catch(() => null);

  async function signIn(credentials) {
    try {
      const sessionId = await sessionIdPromise;
      if (!sessionId) throw new Error('Telemetry session unavailable');

      return await fetch('/api/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, visitorId, sessionId })
      });
    } catch (error) {
      console.error('Device assessment is unavailable.');
      throw error;
    }
  }

  // Call signIn(credentials) from your existing sign-in form handler.
  window.signInWithFingerprint = signIn;
</script>
```


## Server-Side Verify Risk Assessment - If you are using node server or any js server where you can download NPM module

Install the package on your server and keep the secret API key in a server-only environment variable. Never put the secret key in frontend code or a public build.

```js
import { FingerprintIdProofingVerifier } from 'fingerprint-id-proofing/backend';

const verifier = new FingerprintIdProofingVerifier({
  secretApiKey: process.env.FINGERPRINT_ID_PROOFING_SECRET//Pass your Api key here created from dash board fingerprintidproofing.com
});

const assessment = await verifier.verifySessionScore(
  sessionId,
  userId,
  visitorId
);


For CommonJS Express applications, the backend entry also supports `require()`:

```js
const FingerprintIdProofingVerifier = require('fingerprint-id-proofing/backend');

const verifier = new FingerprintIdProofingVerifier({
  secretApiKey: process.env.FINGERPRINT_ID_PROOFING_SECRET
});
```
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

The verifier sends the session ID, user ID, and visitor ID to the assessment API. Network failures and server 5xx responses return a conservative fallback with `policyDecision: "obligation"`, `policyObligation: true`, `sdkFallback: true`, and `errorCode: "ASSESSMENT_UNAVAILABLE"`. Signals in this fallback are marked `unverified`; it never grants approval. Client errors (4xx), malformed responses, and invalid method inputs reject with an error rather than being treated as an outage. Route obligations to MFA or manual review.

## Server-Side Verify Risk Assessment - If you cant use NPM module then use direct API for risk score assesment 

Sign up at [fingerprintidproofing.com](https://fingerprintidproofing.com/) if you are new, or log in to your existing account. In your workspace, create an API key, review analytics logs, and explore the platform features available to your account. Store the key in a server-side environment variable and never expose it in browser code:

```bash
FINGERPRINT_ID_PROOFING_SECRET=your_server_api_key
```
(Alternative for server side npm)
After `verifySessionScore()` returns, read the score and policy decision from the assessment. A score may be unavailable, including in an SDK fallback, so use the service's policy decision as the access-control result and handle `obligation` with step-up verification:


```js
POST /api/v1/verify-assessment
Authorization: Bearer <developer-portal-api-secret>
Content-Type: application/json

{
  "sessionId": "session_from_browser",
  "userId": "authenticated_user_id",
  "visitorId": "visiterId_from_browser"
}

```

## Trusted Device

Assessment responses may include device-trust signals under `userAssertionList[].assertions`, including `test.trustedDevice`, `test.trustedDevice28days`, and `test.gte5Device1d`. Inspect these values along with the policy decision; an SDK fallback marks them `unverified` and must not count as a trusted device.

```js

POST /devices/trust
Authorization: Bearer <same-developer-portal-secret>

{
  "sessionId": "same-recently-assessed-session",
  "userId": "same-authenticated-user-id",
  "visitorId": "visiterId-recently-assessed-visiterId",

}
```

Only offer to remember a device after the user completes your required authentication step, such as MFA. This npm SDK currently supports assessment and trusted-device lookup; it does not expose a trusted-device enrollment method. Use the enrollment endpoint and request format documented in your Fingerprint workspace. Do not guess an endpoint or treat a browser-provided visitor ID alone as proof that a device is trusted.


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
