# Examiner Victoria V2 Structure Refactor Audit

This audit maps the structure-refactor goal to current evidence. It is not a
marketing document; it exists so future work does not depend on memory.

## Goal

Turn the working React + FastAPI V2 into a clearer, more maintainable structure
without rewriting the product from scratch.

## Evidence summary

| Requirement | Current evidence | Status |
| --- | --- | --- |
| Keep React frontend, do not restart from scratch | `v2/frontend/src/App.jsx` remains the coordinator and existing Vite app is preserved. | Done |
| Split frontend responsibilities | `components/layout`, `components/messages`, `hooks`, `utils`, `config`, `styles/mobile.css`. | Done |
| Keep `App.jsx` as coordinator | Frontend architecture doc defines `App.jsx` as top-level coordinator; detailed UI is in components/hooks/utils. | Done |
| Split backend business logic | `ai_provider.py`, `audio_services.py`, `exam_flow_service.py`, `feedback_service.py`, `part3_service.py`, `question_bank_service.py`, `report_service.py`. | Done |
| Preserve FastAPI backend | `v2/backend/app.py` still owns API routes, limits, static frontend serving, and error boundaries. | Done |
| Mobile-first layout separated | Shared styles are in `styles.css`; phone responsive rules are in `styles/mobile.css`. | Done |
| Fixed chat-style composer | `components/layout/AnswerComposer.jsx` owns text/voice composer behavior. | Done |
| Tap-to-record instead of hold-to-speak | Implemented through `useAnswerRecording.js` and composer controls. | Done |
| Faster voice transcription path | `browserSpeechTranscriber.js` uses browser-native speech recognition only where reliable; iPhone/iPad now prefer server Whisper because Safari returned truncated one-word transcripts. Compressed `MediaRecorder` audio is preferred for server fallback elsewhere, with 16 kHz WAV as final fallback. | Done, public iPhone speed accepted at roughly 1-3s |
| iPhone audio fallback | `useSpeechPlayback.js` owns TTS cache, user-gesture audio unlock attempts, and iPhone/Safari tap-to-play fallback. | Done, Safari may still require one tap by platform rule |
| Mobile stage-control layout | `styles/mobile.css` keeps the stage control row compact, and `App.jsx` hides Part 1/topic selection after it has served its purpose. | Done |
| Runtime performance telemetry | Frontend sends transcription, answer, TTS, and frontend-error timing metadata to `/api/telemetry`; `/api/telemetry/summary` exposes recent in-memory metrics without storing answer text. | Done |
| Single local development entry | `run_local_stack.ps1` builds React dist and serves frontend + `/api` on `http://127.0.0.1:5174`. | Done |
| HTTPS phone testing path | `start_https_tunnel.ps1` creates a temporary Cloudflare HTTPS URL and defaults to HTTP/2 for better reliability on this network. | Done |
| Local/HTTPS preview preflight | `check_local_preview.ps1` checks frontend HTML, `/api/health`, and question-bank counts for local and saved tunnel URLs. | Done |
| Public one-service deployment config | Root `Dockerfile`, `.dockerignore`, `railway.json`, `render.yaml`, and `check_deploy_config.ps1` deploy V2 for Railway/Render-style FastAPI hosting serving React dist plus `/api`. | Done, Railway production verified |
| Phase 2 VPS deployment config | `deploy/vps/docker-compose.yml`, `deploy/vps/Caddyfile`, `.env.example`, and README prepare a Hong Kong/Singapore Docker + Caddy automatic HTTPS deployment path. | Done, optional future domestic-access path |
| Mobile QA result gate | `check_mobile_qa_result.ps1` validates the filled `v2/MOBILE_QA_RESULT.md` after real-device testing. | Done, use for regression evidence |
| Browser-test anchors | Core controls and message bubbles expose stable `data-testid` anchors; `check_v2.ps1` verifies they reach the production JS bundle. | Done |
| Structure guardrails | `check_v2.ps1` verifies required frontend/backend modules exist, `App.jsx` and `engine.py` stay coordinator-sized, `styles/mobile.css` owns phone breakpoints, and style import order is preserved. | Done |
| Automated checks | `check_v2.ps1 -SkipInstall` runs compile, script parse, question-bank validation, backend smoke test, frontend build, and secret scan. | Done |
| Git/GitHub readiness check | Canonical Git work now happens in the production repository clone. Old non-Git workspace findings are historical only. | Done |
| Public replacement readiness | V2 is the current production version. V1 Streamlit is frozen as historical reference. | Done |

## Latest known verification

Last checked: 2026-07-10.

Run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\check_v2.ps1 -SkipInstall
```

Expected:

```text
All V2 checks passed.
```

The smoke test intentionally simulates transcription provider failure, so stack
traces mentioning `provider duration parse failed` are acceptable only when the
final line still says all checks passed.

For the current local preview and saved HTTPS tunnel, run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\check_local_preview.ps1 -Port 5174 -UseSavedTunnel
```

Expected:

```text
Local preview check passed.
```

Latest verified preview endpoints:

```text
Local: http://127.0.0.1:5174
HTTPS tunnel: https://bizarre-hurricane-protect-null.trycloudflare.com
```

The HTTPS tunnel is temporary. If it stops working, restart it with:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\start_https_tunnel.ps1 -Port 5174 -Restart
```

If Cloudflare QUIC is unstable on the current network, force HTTP/2 explicitly:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\start_https_tunnel.ps1 -Port 5174 -Restart -Protocol http2
```

## Current maintenance risks and next work

1. For every mobile layout or speech change, repeat iPhone Safari and WeChat
   regression checks:
   - microphone permission appears,
   - tap-to-record starts and stops,
   - transcription works or fails gracefully,
   - Victoria voice playback behavior is acceptable,
   - text fallback still works.
2. The real-device result should be recorded by copying
   `v2/MOBILE_QA_RESULT.template.md` to `v2/MOBILE_QA_RESULT.md` and filling in
   the pass/fail details.
3. Run `v2/scripts/check_mobile_qa_result.ps1` against the filled result when a
   formal mobile regression record is needed.
4. Domestic access remains the largest product-distribution issue. The prepared
   VPS path and future WeChat Mini Program path should be evaluated separately.

## Next conversation startup prompt

If starting a fresh Codex conversation, paste this:

```text
We are working on Examiner Victoria V2 in the current Codex workspace.
Goal: maintain the production React + FastAPI V2 app without regressing mobile speech/chat behavior.
Read README.md, AGENTS.md, docs/DEVELOPMENT_WORKFLOW.md, v2/README.md, v2/COMPLETION_AUDIT.md, v2/MOBILE_QA.md, v2/frontend/ARCHITECTURE.md, and v2/backend/ARCHITECTURE.md first.
Use v2/scripts/check_v2.ps1 -SkipInstall after meaningful changes.
Use v2/scripts/run_local_stack.ps1 for local preview and v2/scripts/start_https_tunnel.ps1 for iPhone HTTPS testing.
Do not change prompts, question-bank content, STT, TTS, reports, or API contracts unless the task explicitly requires it.
```
