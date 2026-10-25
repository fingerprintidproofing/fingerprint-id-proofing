// index.js - Frontend SaaS Collector (Dynamic Key-Exchange Core Engine)

const DYNAMIC_KEY_SERVER_URL = "https://fingerprintidproofing.com/api/v1/get-session-key";
const SECURITY_CLOUD_INGEST_URL = "https://fingerprintidproofing.com/api";

let interactions = { mouse: false, keys: false };
const initializationTime = Date.now();

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', () => { interactions.mouse = true; }, { once: true });
  window.addEventListener('keydown', () => { interactions.keys = true; }, { once: true });
}

/**
 * Applies the service-compatible XOR obfuscation; this is not cryptographic encryption.
 */
function packAndObfuscate(payloadString, key) {
  try {
    let hexResult = "";
    let keyPointer = 0;
    for (let i = 0; i < payloadString.length; i++) {
      const maskedChar = payloadString.charCodeAt(i) ^ key.charCodeAt(keyPointer);
      let hexByte = maskedChar.toString(16);
      if (hexByte.length < 2) hexByte = "0" + hexByte;
      hexResult += hexByte;
      keyPointer++;
      if (keyPointer >= key.length) keyPointer = 0;
    }
    return hexResult;
  } catch (e) { return ""; }
}

function probeCanvasVector() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '0';
    canvas.width = 150; canvas.height = 30;
    ctx.textBaseline = "top"; ctx.font = "12px 'Arial'";
    ctx.fillStyle = "#f60"; ctx.fillText("tm-proofing-v1 🚀", 2, 2);
    let hash = 0; const dataUrl = canvas.toDataURL();
    for (let i = 0; i < dataUrl.length; i++) {
      hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  } catch (e) { return '1'; }
}

function generateTrackingUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  if (window.crypto?.getRandomValues) {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2; h2 ^= h3; h3 ^= h4; h4 ^= h1;

  return [h1, h2, h3, h4]
    .map((value) => (value >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

function getDeepSystemFootprint() {
  const { screen } = window;
  const screenSignature = [
    screen.width || 0, screen.height || 0, screen.availWidth || 0,
    screen.availHeight || 0, screen.colorDepth || 0, window.devicePixelRatio || 1
  ].join('x');

  let intlSignature = 'unknown';
  try {
    intlSignature = [
      Intl.DateTimeFormat().resolvedOptions().calendar || '',
      Intl.DateTimeFormat().resolvedOptions().numberingSystem || '',
      new Date().getTimezoneOffset()
    ].join('|');
  } catch (e) {}

  const systemPreferences = [
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    window.navigator.maxTouchPoints || 0,
    typeof window.orientation !== 'undefined' ? 'mobile' : 'desktop'
  ].join('-');

  return { screenSignature, intlSignature, systemPreferences };
}

let activeSessionId = "";
let activeVisitorId = "";
let activeSessionPromise = null;

function calculateStandaloneVisitorId() {
  if (typeof window === 'undefined') return "";
  if (activeVisitorId) return activeVisitorId;

  const canvasHash = probeCanvasVector();
  const deepFeatures = getDeepSystemFootprint();

  let gpuRenderer = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && debug) {
      gpuRenderer = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) || 'unknown';
    }
  } catch (e) {}

  const hardwareSeed = [
    canvasHash,
    gpuRenderer,
    window.navigator.hardwareConcurrency || 0,
    deepFeatures.screenSignature,
    deepFeatures.intlSignature,
    deepFeatures.systemPreferences,
    (window.navigator.userAgent || '').replace(/\d+\.\d+\.\d+/g, '') 
  ].join(':::');

  activeVisitorId = cyrb128(hardwareSeed);
  return activeVisitorId;
}

/**
 * 📡 SECURE ASYNCHRONOUS INGESTION BEACON
 * Performs background handshakes to resolve dynamic seeds cleanly
 */
function triggerSecurityCloudIngestion() {
  if (typeof window === 'undefined') return Promise.resolve("");
  if (activeSessionPromise) return activeSessionPromise;

  activeSessionId = generateTrackingUuid();
  activeSessionPromise = (async () => {
    try {
      const visitorId = calculateStandaloneVisitorId();
      const canvasHash = probeCanvasVector();

      let gpuRenderer = 'unknown';
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debug = gl?.getExtension('WEBGL_debug_renderer_info');
        if (gl && debug) gpuRenderer = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) || 'unknown';
      } catch (e) {}

      const rawTelemetryObject = {
        t: Date.now(),
        vid: visitorId,
        el: {
          ua: window.navigator.userAgent || 'unknown',
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
          ln: window.navigator.languages || ['en-US'],
          sc: `${window.screen.width || 0}x${window.screen.height || 0}`
        },
        ad: {
          cr: window.navigator.hardwareConcurrency || 0,
          cv: canvasHash,
          gp: gpuRenderer,
          fl: { wd: !!window.navigator.webdriver },
          bh: { mm: interactions.mouse, kd: interactions.keys, du: Date.now() - initializationTime }
        }
      };

      const exchangeResponse = await fetch(DYNAMIC_KEY_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId })
      });
      if (!exchangeResponse.ok) throw new Error('Key exchange request was rejected.');

      const { dynamicCipherKey } = await exchangeResponse.json();
      if (typeof dynamicCipherKey !== 'string' || dynamicCipherKey.length === 0) {
        throw new Error('Key exchange response did not contain a valid key.');
      }

      const serializedString = JSON.stringify(rawTelemetryObject);
      const encryptedJeString = packAndObfuscate(serializedString, dynamicCipherKey);
      if (!encryptedJeString) throw new Error('Telemetry payload could not be encoded.');

      const queryString = `session_id=${encodeURIComponent(activeSessionId)}&je=${encryptedJeString}`;
      const fullTargetUrl = `${SECURITY_CLOUD_INGEST_URL}/v1/telemetry?${queryString}`;
      const beaconQueued = window.navigator.sendBeacon?.(fullTargetUrl) === true;

      if (!beaconQueued) {
        const ingestResponse = await fetch(fullTargetUrl, { method: 'POST', keepalive: true });
        if (!ingestResponse.ok) throw new Error('Telemetry ingestion request was rejected.');
      }

      return activeSessionId;
    } catch (error) {
      activeSessionId = "";
      activeSessionPromise = null;
      console.error('Telemetry session initialization failed.');
      throw new Error('Fingerprint ID Proofing could not initialize a telemetry session.', { cause: error });
    }
  })();

  return activeSessionPromise;
}

// 📦 Core runtime engine instance container
const FingerprintIdProofing = {
  getVisitorId: () => activeVisitorId || calculateStandaloneVisitorId(),
  getSessionId: () => triggerSecurityCloudIngestion()
};

// =========================================================================
// 🚀 DUAL-MODULE CONTAINER EXPORTS (Verifies NPM & CDN compatibility bounds)
// =========================================================================

// 1. Support for traditional Vanilla Script Tag CDNs (jsDelivr / UNPKG)
if (typeof window !== 'undefined') {
  window.FingerprintIdProofing = FingerprintIdProofing;
}

// 2. Support for modern JavaScript build tool chains (Vite, Webpack, Rollup)
export default FingerprintIdProofing;
