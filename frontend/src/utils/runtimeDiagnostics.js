export const AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
];

export function analyzeUserAgent(userAgent = "", platform = "", maxTouchPoints = 0) {
  const ua = String(userAgent || "");
  const devicePlatform = String(platform || "");
  const isWeChat = /MicroMessenger/i.test(ua);
  const isIPadDesktopMode = devicePlatform === "MacIntel" && Number(maxTouchPoints || 0) > 1;
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || isIPadDesktopMode;
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile/i.test(ua);
  return {
    deviceType: isMobile ? "mobile" : "desktop",
    isAndroid,
    isIOS,
    isWeChat,
  };
}

export function getPageEnvironment(overrides = {}) {
  const nav = overrides.navigator || (typeof navigator !== "undefined" ? navigator : {});
  const loc = overrides.location || (typeof window !== "undefined" ? window.location : { protocol: "", hostname: "" });
  const secureContext =
    typeof overrides.secureContext === "boolean"
      ? overrides.secureContext
      : Boolean(typeof window !== "undefined" && window.isSecureContext);
  const userAgent = nav.userAgent || "";
  const platform = nav.platform || "";
  const maxTouchPoints = nav.maxTouchPoints || 0;
  return {
    protocol: loc.protocol || "",
    https: loc.protocol === "https:" || loc.hostname === "localhost" || loc.hostname === "127.0.0.1",
    secureContext,
    userAgent,
    platform,
    maxTouchPoints,
    ...analyzeUserAgent(userAgent, platform, maxTouchPoints),
  };
}

export function getRecordingSupport(overrides = {}) {
  const nav = overrides.navigator || (typeof navigator !== "undefined" ? navigator : {});
  const win = overrides.window || (typeof window !== "undefined" ? window : {});
  const mediaDevices = Boolean(nav.mediaDevices);
  const getUserMedia = Boolean(nav.mediaDevices?.getUserMedia);
  const mediaRecorder = Boolean(win.MediaRecorder);
  const mimeSupport = Object.fromEntries(
    AUDIO_MIME_TYPES.map((type) => [
      type,
      mediaRecorder && typeof win.MediaRecorder.isTypeSupported === "function"
        ? Boolean(win.MediaRecorder.isTypeSupported(type))
        : false,
    ]),
  );
  return {
    mediaDevices,
    getUserMedia,
    mediaRecorder,
    mimeSupport,
  };
}

export function getDownloadSupport(overrides = {}) {
  const blobCtor = overrides.Blob || (typeof Blob !== "undefined" ? Blob : null);
  const urlApi = overrides.URL || (typeof URL !== "undefined" ? URL : null);
  return {
    blob: Boolean(blobCtor),
    objectUrl: Boolean(urlApi?.createObjectURL),
  };
}

export function checkLocalStorage(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return { available: false, message: "localStorage is not available." };
  const key = "ev-runtime-diagnostics-test";
  try {
    storage.setItem(key, "1");
    storage.removeItem(key);
    return { available: true, message: "localStorage can write and clean up a test key." };
  } catch (_) {
    try {
      storage.removeItem(key);
    } catch (__) {
      // Ignore cleanup failure for an unavailable storage implementation.
    }
    return { available: false, message: "localStorage write failed." };
  }
}

export function buildDiagnosticCopyText(snapshot) {
  const environment = snapshot.environment || {};
  const recording = snapshot.recording || {};
  const api = snapshot.api || {};
  const playback = snapshot.playback || {};
  const storage = snapshot.storage || {};
  const lines = [
    "Examiner Victoria runtime diagnostics",
    `Time: ${snapshot.time || new Date().toISOString()}`,
    `User agent: ${environment.userAgent || "unknown"}`,
    `Device: ${environment.deviceType || "unknown"}`,
    `WeChat: ${environment.isWeChat ? "yes" : "no"}`,
    `iOS: ${environment.isIOS ? "yes" : "no"}`,
    `Android: ${environment.isAndroid ? "yes" : "no"}`,
    `HTTPS: ${environment.https ? "yes" : "no"}`,
    `Secure context: ${environment.secureContext ? "yes" : "no"}`,
    `API: ${api.status || "not tested"}${api.elapsedMs != null ? ` (${api.elapsedMs} ms)` : ""}`,
    `Recording mediaDevices: ${recording.mediaDevices ? "yes" : "no"}`,
    `Recording getUserMedia: ${recording.getUserMedia ? "yes" : "no"}`,
    `Recording MediaRecorder: ${recording.mediaRecorder ? "yes" : "no"}`,
    `MIME support: ${Object.entries(recording.mimeSupport || {})
      .map(([type, supported]) => `${type}=${supported ? "yes" : "no"}`)
      .join(", ")}`,
    `Audio playback: ${playback.status || "not tested"}`,
    `localStorage: ${storage.available ? "yes" : "no"}`,
  ];
  return lines.join("\n");
}