// index.js - Frontend SaaS Collector (Smart Network-Throttled Profiler)

const CIPHER_KEY = "39467c7518514b5391138855f642e05c";
const SECURITY_CLOUD_INGEST_URL = "https://fingerprintidproofing.com/api";

let interactions = { mouse: false, keys: false };
const initializationTime = Date.now();

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', () => { interactions.mouse = true; }, { once: true });
  window.addEventListener('keydown', () => { interactions.keys = true; }, { once: true });
}

function packAndObfuscate(payloadString, key = CIPHER_KEY) {
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function cyrb128(str) {
  let h1 = 1779033703, h2 = 3024733165, h3 = 3362453659, h4 = 502494325;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  return [(h1 ^ h2) >>> 0].toString(16);
}

function getDeepSystemFootprint() {
  const { navigator, screen } = window;
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
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    window.navigator.maxTouchPoints || 0,
    typeof window.orientation !== 'undefined' ? 'mobile' : 'desktop'
  ].join('-');

  return { screenSignature, intlSignature, systemPreferences };
}

// Memory caching allocations for runtime states
let activeSessionId = "";
let activeVisitorId = "";

/**
 * 🎯 BRANCH A: STANDALONE VISITOR ID CALCULATION (100% Offline, Zero API Traffic)
 */
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

  activeVisitorId = `vis_${cyrb128(hardwareSeed)}`;
  return activeVisitorId;
}

/**
 * 📡 BRANCH B: ADVANCED SECURITY INGESTION (Only fires if a full assessment is needed)
 */
function triggerSecurityCloudIngestion() {
  if (typeof window === 'undefined') return "";
  if (activeSessionId) return activeSessionId; // Return already active transaction uuid pointers

  // 1. Calculate identifiers and generate the fingerprint parameters
  activeSessionId = generateTrackingUuid();
  const visitorId = calculateStandaloneVisitorId();
  const canvasHash = probeCanvasVector();

  let gpuRenderer = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && debug) gpuRenderer = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) || 'unknown';
  } catch (e) {}

  // 2. Compile structural metadata tracking variables payload
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

  const serializedString = JSON.stringify(rawTelemetryObject);
  const encryptedJeString = packAndObfuscate(serializedString);
  
  const queryString = `session_id=${activeSessionId}&je=${encryptedJeString}`;
  const fullTargetUrl = `${SECURITY_CLOUD_INGEST_URL}/v1/telemetry?${queryString}`; // Added clean route path formatting

  // 3. Fire the secure background logging beacon pipeline channel
  if (window.navigator.sendBeacon) {
    window.navigator.sendBeacon(fullTargetUrl);
  } else {
    fetch(fullTargetUrl, { method: 'POST', keepalive: true }).catch(() => {});
  }

  return activeSessionId;
}

// =========================================================================
// 🌐 GLOBAL WINDOW NAMESPACE: LAUNCH ON DEMAND (No automated listeners)
// =========================================================================
if (typeof window !== 'undefined') {
  window.FingerprintIdProofing = {
    // Calling getVisitorId() calculates hardware signatures with 0 network calls!
    getVisitorId: () => activeVisitorId || calculateStandaloneVisitorId(),
    
    // Calling getSessionId() explicitly activates and streams the fraud beacon telemetry
    getSessionId: () => activeSessionId || triggerSecurityCloudIngestion()
  };
}
