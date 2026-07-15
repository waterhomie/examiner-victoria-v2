import { useEffect, useMemo, useState } from "react";
import { fetchRuntimeDiagnostics } from "../../api.js";
import {
  buildDiagnosticCopyText,
  checkLocalStorage,
  getDownloadSupport,
  getPageEnvironment,
  getRecordingSupport,
} from "../../utils/runtimeDiagnostics.js";

const WECHAT_ADVICE =
  "当前处于微信内置浏览器。部分设备可能无法稳定录音、播放或下载。遇到问题时，请使用 Safari 或 Chrome 打开。";

function formatStatus(value) {
  return value ? "可用" : "不可用";
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function RuntimeDiagnosticsPanel({ onClose }) {
  const [apiStatus, setApiStatus] = useState({ status: "not tested", elapsedMs: null, message: "尚未检测" });
  const [microphoneStatus, setMicrophoneStatus] = useState("尚未测试");
  const [playbackStatus, setPlaybackStatus] = useState("not tested");
  const [copyStatus, setCopyStatus] = useState("");

  const environment = useMemo(() => getPageEnvironment(), []);
  const recording = useMemo(() => getRecordingSupport(), []);
  const storage = useMemo(() => checkLocalStorage(), []);
  const download = useMemo(() => getDownloadSupport(), []);

  async function runApiCheck() {
    const startedAt = performance.now();
    setApiStatus({ status: "checking", elapsedMs: null, message: "正在检测 API" });
    try {
      const payload = await fetchRuntimeDiagnostics();
      setApiStatus({
        status: payload?.status === "ok" ? "reachable" : "unexpected",
        elapsedMs: Math.round(performance.now() - startedAt),
        message: payload?.status === "ok" ? "API 可达，诊断接口未调用真实 provider。" : "API 返回了非预期状态。",
      });
    } catch (error) {
      setApiStatus({
        status: "failed",
        elapsedMs: Math.round(performance.now() - startedAt),
        message: error?.message || "API 不可达。",
      });
    }
  }

  async function testMicrophonePermission() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneStatus("当前浏览器不支持 getUserMedia。请使用 Safari 或 Chrome。");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneStatus("麦克风权限可用，测试已结束并释放录音设备。");
    } catch (error) {
      setMicrophoneStatus(error?.message || "麦克风权限测试失败。请检查浏览器权限。");
    } finally {
      stream?.getTracks?.().forEach((track) => track.stop());
    }
  }

  async function testLocalPlayback() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setPlaybackStatus("failed: AudioContext unavailable");
      return;
    }
    let context;
    try {
      context = new AudioContextClass();
      if (context.state === "suspended") await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 660;
      gain.gain.value = 0.025;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.14);
      setPlaybackStatus("played");
      window.setTimeout(() => context.close().catch(() => {}), 220);
    } catch (error) {
      setPlaybackStatus(`failed: ${error?.message || "playback blocked"}`);
      if (context) context.close().catch(() => {});
    }
  }

  async function copyDiagnostics() {
    const text = buildDiagnosticCopyText({
      time: new Date().toISOString(),
      environment,
      recording,
      api: apiStatus,
      playback: { status: playbackStatus },
      storage,
    });
    try {
      await copyText(text);
      setCopyStatus("诊断结果已复制。请注意其中不包含 Cookie、Token、语音或练习记录。");
    } catch (_) {
      setCopyStatus("复制失败。请手动选择页面中的诊断信息。");
    }
  }

  useEffect(() => {
    void runApiCheck();
  }, []);

  return (
    <section className="diagnostics-panel" aria-label="系统检测" data-testid="runtime-diagnostics-panel">
      <div className="diagnostics-panel-header">
        <div>
          <div className="eyebrow">Domestic beta readiness</div>
          <h2>系统检测</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onClose} data-testid="close-diagnostics-button">
          Close
        </button>
      </div>

      {environment.isWeChat ? <div className="notice-card diagnostics-warning">{WECHAT_ADVICE}</div> : null}

      <div className="diagnostics-grid">
        <article className="diagnostics-card">
          <h3>页面环境</h3>
          <dl>
            <dt>HTTPS</dt>
            <dd>{formatStatus(environment.https)}</dd>
            <dt>Secure context</dt>
            <dd>{formatStatus(environment.secureContext)}</dd>
            <dt>设备</dt>
            <dd>{environment.deviceType}</dd>
            <dt>微信</dt>
            <dd>{environment.isWeChat ? "是" : "否"}</dd>
            <dt>iOS / Android</dt>
            <dd>{environment.isIOS ? "iOS" : environment.isAndroid ? "Android" : "否"}</dd>
          </dl>
          <p className="diagnostics-muted">{environment.userAgent}</p>
        </article>

        <article className="diagnostics-card">
          <h3>后端连接</h3>
          <p>{apiStatus.message}</p>
          <p className="diagnostics-muted">
            状态：{apiStatus.status} {apiStatus.elapsedMs != null ? `· ${apiStatus.elapsedMs} ms` : ""}
          </p>
          <button className="ghost-button" type="button" onClick={runApiCheck} data-testid="runtime-api-check-button">
            重新检测 API
          </button>
        </article>

        <article className="diagnostics-card">
          <h3>录音能力</h3>
          <dl>
            <dt>mediaDevices</dt>
            <dd>{formatStatus(recording.mediaDevices)}</dd>
            <dt>getUserMedia</dt>
            <dd>{formatStatus(recording.getUserMedia)}</dd>
            <dt>MediaRecorder</dt>
            <dd>{formatStatus(recording.mediaRecorder)}</dd>
          </dl>
          <ul className="diagnostics-list">
            {Object.entries(recording.mimeSupport).map(([type, supported]) => (
              <li key={type}>{type}: {supported ? "支持" : "不支持或未知"}</li>
            ))}
          </ul>
          <button className="ghost-button" type="button" onClick={testMicrophonePermission} data-testid="microphone-permission-test-button">
            测试麦克风权限
          </button>
          <p className="diagnostics-muted">{microphoneStatus}</p>
        </article>

        <article className="diagnostics-card">
          <h3>播放、存储与下载</h3>
          <p>本地声音播放：{playbackStatus}</p>
          <button className="ghost-button" type="button" onClick={testLocalPlayback} data-testid="local-playback-test-button">
            测试声音播放
          </button>
          <dl>
            <dt>localStorage</dt>
            <dd>{storage.available ? "可写" : "不可写"}</dd>
            <dt>Blob</dt>
            <dd>{formatStatus(download.blob)}</dd>
            <dt>URL.createObjectURL</dt>
            <dd>{formatStatus(download.objectUrl)}</dd>
          </dl>
          <p className="diagnostics-muted">微信环境中下载可能受限，可优先复制诊断结果。</p>
        </article>
      </div>

      <div className="diagnostics-actions">
        <button className="score-button" type="button" onClick={copyDiagnostics} data-testid="copy-diagnostics-button">
          复制诊断结果
        </button>
        <span>{copyStatus}</span>
      </div>
    </section>
  );
}