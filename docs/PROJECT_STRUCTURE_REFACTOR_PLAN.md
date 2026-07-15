# Examiner Victoria: Version-neutral Project Structure Refactor Plan

> Phase 0 audit and design only. Baseline: `main` commit `3b1c4f3916491e8b2320ac1ae64e1fb8a68b9cbd` (PR #22 merge), audited on 2026-07-15. This document does not move source files or change application behavior.

## 1. Executive decision

**Recommendation: conditional GO, now, but not as one implementation PR.** The active application should move to version-neutral top-level `frontend/`, `backend/`, and `scripts/` paths before more product work deepens the current coupling. Begin only after this Phase 0 plan is reviewed and merged, when no competing feature branch is changing Docker, backend imports, scripts, or deployment documentation.

Use three separately reviewable implementation phases:

1. **Phase 1 — core runtime paths:** move `v2/frontend` and `v2/backend`; update Python entrypoints, Docker paths, runtime metadata, deployment checks, and the minimum current documentation needed to keep the build operable.
2. **Phase 2 — question-bank package (optional and deferred):** after Phase 1 is deployed and stable, move the two executable question-bank modules into `backend/question_bank/`; keep the root validator entrypoint.
3. **Phase 3 — scripts and active documentation:** move/neutralize scripts, relocate active `v2/` documents, and leave only frozen V2 evidence under `v2/`.

The expected risk is **medium-high for Phase 1**, **medium for Phase 2**, and **medium for Phase 3**. The risk comes from path coupling, not from intended product changes. A one-shot PR would combine 115 affected paths, CloudBase build changes, local-run changes, and an optional data-module move; that is unnecessarily hard to review and roll back.

The migration must not change the API endpoints, request/response schemas, Practice/Mock behavior, Prompt, question-bank content, Provider behavior, or `ExamSession` schema. Two public metadata values are intentionally candidates for neutralization: the FastAPI title and the `app` identifier returned by health/diagnostics. That is not a schema change, but it is an observable value change and must be documented and tested.

## 2. Audit scope and reproducible counts

The audit used tracked text at the baseline commit. Generated files, `node_modules`, ignored `.env` files, Git history, and cloud-console state were not read. Relevant current-state references include [README](../README.md), [AGENTS](../AGENTS.md), [V3 Current Status](V3_CURRENT_STATUS.md), [Dockerfile](../Dockerfile), [backend config](../v2/backend/core/config.py), and [the current project check](../v2/scripts/check_v2.ps1).

Counting definitions:

- **Version-bound path reference:** one tracked-text occurrence matching `v2[/\\]`. This covers Unix and Windows forms, including `/app/v2/...` and `.\v2\...`.
- **Python package reference:** one matched line containing `v2.backend` or an equivalent `from v2`, `import v2`, `python -m v2`, or Uvicorn module form.
- Counts are baseline facts, not estimates after this document is added.

| Measure | Result |
| --- | ---: |
| `v2[/\\]` occurrences | **251** |
| Matching path-reference lines | **232** |
| Files with path references | **28** |
| Python package-reference occurrences/lines | **24** |
| Files with Python package references | **10** |
| Explicit Python import statements using `v2...` | **11** |
| Tracked files under `v2/frontend` | **50** |
| Tracked files under `v2/backend` | **27** |
| Tracked files under `v2/scripts` | **15** |
| Core directory moves | **92** |
| Version-bound PowerShell function definitions | **6** |
| Script filenames that should be neutralized | **2** |
| Estimated unique affected paths, all phases | **115** |
| Estimated unique affected paths without optional Phase 2 | **111** |

### 2.1 Path-reference ledger

The 251 path occurrences are distributed as follows; this ledger makes the number independently checkable.

| Tracked file | Occurrences |
| --- | ---: |
| `.dockerignore` | 6 |
| `AGENTS.md` | 4 |
| `deploy/vps/docker-compose.yml` | 1 |
| `deploy/vps/README.md` | 1 |
| `Dockerfile` | 12 |
| `docs/DEVELOPMENT_WORKFLOW.md` | 1 |
| `docs/V3_CLOUDBASE_MIGRATION_PLAN.md` | 3 |
| `docs/V3_CURRENT_STATUS.md` | 3 |
| `docs/V3_KICKOFF_CONTEXT.md` | 29 |
| `docs/V3_RUNTIME_DEPENDENCIES.md` | 4 |
| `README.md` | 2 |
| `v2/API_CONTRACT.md` | 1 |
| `v2/backend/ARCHITECTURE.md` | 2 |
| `v2/CHECKLIST.md` | 4 |
| `v2/COMPLETION_AUDIT.md` | 18 |
| `v2/DEPLOYMENT.md` | 7 |
| `v2/frontend/ARCHITECTURE.md` | 1 |
| `v2/MOBILE_QA.md` | 8 |
| `v2/MOBILE_QA_RESULT.template.md` | 2 |
| `v2/README.md` | 19 |
| `v2/RUN_LOCAL.md` | 4 |
| `v2/scripts/check_deploy_config.ps1` | 13 |
| `v2/scripts/check_mobile_qa_result.ps1` | 3 |
| `v2/scripts/check_v2.ps1` | 97 |
| `v2/scripts/run_backend.ps1` | 1 |
| `v2/scripts/run_frontend.ps1` | 1 |
| `v2/scripts/run_local_stack.ps1` | 2 |
| `v2/scripts/start_https_tunnel.ps1` | 2 |
| **Total** | **251** |

### 2.2 Python package-reference ledger

| Tracked file | Matched lines |
| --- | ---: |
| `Dockerfile` | 1 |
| `docs/V3_CLOUDBASE_MIGRATION_PLAN.md` | 1 |
| `docs/V3_KICKOFF_CONTEXT.md` | 3 |
| `v2/backend/ARCHITECTURE.md` | 1 |
| `v2/backend/smoke_test.py` | 11 |
| `v2/README.md` | 3 |
| `v2/scripts/check_deploy_config.ps1` | 1 |
| `v2/scripts/check_v2.ps1` | 1 |
| `v2/scripts/run_backend.ps1` | 1 |
| `v2/scripts/run_local_stack.ps1` | 1 |
| **Total** | **24** |

The 11 real Python import statements are all at the top of `v2/backend/smoke_test.py`. Backend production modules otherwise use relative imports, so moving the package does not require rewriting every service import. No dynamic import or monkeypatch target uses the `v2.backend` namespace; the dynamic module injection in the smoke test is for the mocked Tencent SDK.

## 3. Current structure

```text
repository root
├── Dockerfile
├── .dockerignore
├── .gitignore
├── railway.json
├── render.yaml
├── question_bank.py
├── pdf_recall_question_bank.py
├── validate_question_bank.py
├── deploy/vps/
├── docs/
└── v2/
    ├── __init__.py
    ├── frontend/                 # 50 tracked files
    ├── backend/                  # 27 tracked files
    ├── scripts/                  # 15 tracked files
    └── active and historical Markdown files
```

Runtime shape:

- Vite builds the React application.
- FastAPI serves `dist/`, SPA fallback, and `/api` from one container.
- Docker builds from repository root and listens on `8080`.
- CloudBase Run uses repository `waterhomie/examiner-victoria`, branch `main`, and the root Dockerfile.
- There is no application database; browser-held session state is sent with API requests.

No tracked `.github/`, `.vscode/`, `.obsidian/`, `.cloudbase/`, `cloudbaserc.json`, or `cloudbase.json` exists at the baseline. GitHub Actions, GitHub Deployment metadata, and editor settings therefore do not create tracked path migrations today. The canonical Windows folder name is intentionally out of scope and remains unchanged.

## 4. Why the current structure is becoming costly

1. `v2/` describes a historical release while containing the active V3 Beta product.
2. Docker, PowerShell, Python module entrypoints, documentation, local cache names, and deployment assertions encode the same versioned path differently.
3. New contributors and Codex must first learn that `v2/` is current, not frozen.
4. The top-level repository does not expose the primary frontend/backend boundaries immediately.
5. A future V4 would either deepen the misleading name or force a larger migration.
6. Versioned operational names such as `check_v2.ps1`, `v2.backend.app`, and `examiner-victoria-v2` metadata invite accidental propagation into new tooling.

The refactor is justified by discoverability and maintenance cost, not by a need to change architecture. React, FastAPI, the one-container deployment, pnpm, and the current Python dependency model should remain.

## 5. Dependency inventory

### 5.1 Python package and filesystem dependencies

- `v2/__init__.py` and `v2/backend/__init__.py` create the `v2.backend` package.
- `v2/backend/smoke_test.py` has 11 absolute `v2.backend...` imports.
- Docker and three PowerShell scripts launch `v2.backend.app:app` or `v2.backend.smoke_test`; the deployment check asserts that string.
- Internal backend production modules use relative imports and can remain relative after becoming `backend.*`.
- `v2/backend/core/config.py` uses path depth:
  - `ROOT_DIR = ...parents[3]` must become `parents[2]` after the move.
  - default `FRONTEND_DIST = ...parents[2] / "frontend" / "dist"` becomes correct automatically after the move and should be covered by a test.
  - local env lookup `ROOT_DIR / "v2" / "backend" / ".env"` must become `ROOT_DIR / "backend" / ".env"`.
- `v2/backend/question_bank_service.py` uses `parents[2]` to reach repository root; after the move it must use `parents[1]` while root question-bank modules remain in place.
- Real ignored `.env` contents must never be read. If a developer has `v2/backend/.env`, migration instructions should move it locally to `backend/.env` without printing or committing it.

### 5.2 Frontend dependencies

- `package.json`, lockfile, workspace file, Vite config, smoke test, public assets, and all source files are self-contained under `v2/frontend`.
- `pnpm-workspace.yaml` has no cross-directory package path.
- Vite imports and frontend smoke paths are relative, so most frontend files are move-only.
- `package.json` still uses `examiner-victoria-v2-frontend`; neutralize it to `examiner-victoria-frontend`. The current lockfile importer has no copied package name, so lockfile content should change only if pnpm proves it necessary.
- `frontend/src/utils/downloads.js` embeds `Examiner Victoria V2` in exported text and should use `Examiner Victoria`.
- `frontend/src/config/appConfig.js` uses `examiner-victoria-v2-state` as the localStorage key. **Do not rename it in the structural PR.** Keeping the legacy storage key preserves refresh-restored sessions. A future key migration would need dual-read/write tests and is a separate product-compatibility task.
- Frontend build output remains generated and untracked. After the move, reinstall dependencies under `frontend/node_modules` and regenerate `frontend/dist`; do not commit either.

### 5.3 PowerShell dependencies

There are 15 scripts. Fourteen contain a version-bound path, label, function, repository, cache filename, or bundle name; `generate_admin_token.ps1` is move-only.

Six function definitions require neutral names:

| Current | Target |
| --- | --- |
| `Resolve-V2Python` | `Resolve-ProjectPython` |
| `Resolve-V2Pnpm` | `Resolve-ProjectPnpm` |
| `Add-V2PythonPath` | `Add-ProjectPythonPath` |
| `Invoke-V2Native` | `Invoke-ProjectNative` |
| `Resolve-V2Git` | `Resolve-ProjectGit` |
| `Resolve-V2Gh` | `Resolve-ProjectGh` |

Two filenames require neutral names:

| Current | Target |
| --- | --- |
| `check_v2.ps1` | `check_project.ps1` |
| `check_deployed_v2.ps1` | `check_deployed_app.ps1` |

Moving scripts from `v2/scripts` to root `scripts` changes repository-root resolution from `Join-Path $PSScriptRoot "..\.."` to `Join-Path $PSScriptRoot ".."`. That affects every script using the two-level assumption, including the bundled `gh` lookup in `sync_public_deploy_github.ps1`.

Local temporary names (`v2_server_pids.txt`, `v2_tunnel_*`, `v2_backend_deps`, and related logs) should be neutralized only after the old local stack and tunnel are stopped. The new stop helper should recognize legacy PID/tunnel filenames for one transition cycle so cleanup remains safe.

### 5.4 Docker, hosting, and deployment dependencies

The Dockerfile contains the highest concentration of runtime path coupling:

- builder `WORKDIR /app/v2/frontend`
- frontend `COPY v2/frontend/...`
- `FRONTEND_DIST=/app/v2/frontend/dist`
- backend requirements path and temporary filename
- `COPY v2 ./v2`
- frontend dist copy into `./v2/frontend/dist`
- Uvicorn entrypoint `v2.backend.app:app`

Target container paths:

```text
/app/frontend
/app/frontend/dist
/app/backend
python -m uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8080}
```

`deploy/vps/docker-compose.yml` duplicates `FRONTEND_DIST` and must change. `railway.json` and `render.yaml` use the root Dockerfile and `/api/health` without source paths; they need validation but no structural edit. The historical Render service name `examiner-victoria-v2` and frozen Railway V2 names should not be mechanically renamed because that could create or disconnect external services.

There is no tracked CloudBase build manifest. CloudBase source repository, branch `main`, Dockerfile path, port `8080`, health path, and service name remain human-controlled and unchanged. A console-level `FRONTEND_DIST` or custom start-command override, if one exists, would need a one-time human update; repository evidence cannot prove whether such an override exists.

### 5.5 Root question-bank dependencies

Current chain:

```text
pdf_recall_question_bank.py
  -> imported by question_bank.py
question_bank.py
  -> imported by v2/backend/question_bank_service.py
  -> imported by validate_question_bank.py
Dockerfile
  -> copies all three root files
check_v2.ps1
  -> validates/compiles all three
prepare_public_deploy_bundle.ps1
  -> includes all three
```

The two bank files are executable Python modules, not passive JSON assets. `backend/question_bank/` is therefore clearer than a generic root `data/` directory or `backend/data/`. Moving them in Phase 1 would combine package, data, Docker, and validation risk, so keep them at root during Phase 1.

Recommended Phase 2 target:

```text
backend/question_bank/__init__.py
backend/question_bank/catalog.py
backend/question_bank/pdf_recall.py
validate_question_bank.py             # remains a root command
```

Phase 2 must change imports only, never question-bank content.

### 5.6 Version-bound metadata and compatibility names

Current operational values requiring explicit decisions:

| Location | Current value | Decision |
| --- | --- | --- |
| FastAPI title | `Examiner Victoria V2 API` | Change to `Examiner Victoria API` in Phase 1 |
| health/diagnostics `app` | `examiner-victoria-v2` | Change to `examiner-victoria` in Phase 1; schema unchanged |
| frontend package | `examiner-victoria-v2-frontend` | Change to `examiner-victoria-frontend` in Phase 1 |
| export headings | `Examiner Victoria V2 ...` | Change to stable product name in Phase 1 |
| localStorage key | `examiner-victoria-v2-state` | Preserve for session compatibility |
| CloudBase service | `examiner-victoria-v3-beta` | Preserve; console/service rename is out of scope |
| frozen Railway/Render/V2 names | versioned | Preserve as external or historical identifiers |
| V2 tag, Release, QA evidence | versioned | Preserve permanently |

## 6. Recommended target structure

After all three phases (and optional Phase 2):

```text
repository root
├── frontend/
│   ├── src/
│   ├── public/
│   ├── smoke_test.js
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── core/
│   ├── routes/
│   ├── question_bank/             # only after optional Phase 2
│   ├── app.py
│   ├── smoke_test.py
│   └── requirements.txt
├── scripts/
│   ├── check_project.ps1
│   ├── check_deployed_app.ps1
│   └── other neutral helpers
├── docs/
│   ├── APPLICATION.md
│   ├── API_CONTRACT.md
│   ├── DEPLOYMENT.md
│   ├── RUN_LOCAL.md
│   └── current V3 and operational documents
├── deploy/
├── v2/
│   └── COMPLETION_AUDIT.md         # frozen historical evidence only
├── validate_question_bank.py
├── Dockerfile
├── README.md
├── AGENTS.md
├── .gitignore
└── .dockerignore
```

The remaining `v2/` directory is explicitly historical and is not a Python package, runtime source root, deployment input, or task base. `v2/__init__.py` is removed after the backend package moves.

## 7. Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep active code under `v2/` indefinitely | Reject | Lowest immediate effort but growing discovery and path-coupling cost |
| One-shot move of source, scripts, docs, question bank, and metadata | Reject | 115-path review and rollback surface is too broad |
| Compatibility symlinks from `v2/` | Reject | Fragile across Windows, Git, Docker build contexts, and cloud builders |
| Duplicate packages/shims under both `v2.backend` and `backend` | Reject | Creates two import identities and hides incomplete migration |
| Nx, Turborepo, Bazel, Kubernetes, microservices, new CI platform | Reject | No evidence of need; unrelated to the path problem |
| Split frontend/backend repositories | Reject | Damages one-container and same-origin simplicity |
| Move question bank in Phase 1 | Defer | Adds data/import risk without being required for core path neutrality |

## 8. Impact matrix

| Category | Current path or name | Target path or name | Affected files | Risk | Validation | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| Frontend | `v2/frontend` | `frontend` | 50 moved files; package/export metadata | Medium | smoke, build, built HTML/assets | 1 |
| Backend | `v2/backend` | `backend` | 27 moved files; config/app/health/smoke content | High | compile, backend smoke, API routes | 1 |
| Python imports | `v2.backend...` | `backend...` | 24 repository references; 11 imports | High | grep zero active refs, `python -m backend.smoke_test` | 1 |
| Docker | `/app/v2/...`, `COPY v2`, `v2.backend.app` | `/app/frontend`, `/app/backend`, `backend.app` | `Dockerfile`, `.dockerignore` | Critical | image build, container 8080, health, static page | 1 |
| PowerShell | `v2/scripts`, V2 functions | `scripts`, Project functions | 15 scripts, 6 functions, 2 filenames | High | parse all scripts, `check_project.ps1` | 3 |
| Frontend smoke | runs under `v2/frontend` | runs under `frontend` | moved smoke test; static metadata checks | Low | `pnpm run test:smoke` | 1 |
| Backend smoke | imports `v2.backend` | imports `backend` | 11 import lines plus metadata expectations | High | deterministic backend smoke | 1 |
| Question bank | three root modules/validator | backend package plus root validator | 3 existing files + 1 new package file; overlapping consumers | Medium | validator, counts, backend smoke | 2 |
| CloudBase | root Dockerfile builds `v2` paths | same source/branch, new image paths | Docker plus conditional console override | High | new version, diagnostics SHA, controlled flow | 1/2 |
| Railway | root Dockerfile | same | `railway.json` validates unchanged contract | Medium | config check; no deployment required | 1 |
| GitHub docs | active paths mixed with history | current neutral paths; V2 history retained | 19 current/moved docs in full plan | Medium | link check, stale-current-state scan | 1/3 |
| Local development | `.\v2\scripts`, old env/cache paths | `.\scripts`, `backend/.env`, neutral cache names | scripts and run guides | High | clean-machine/local stack smoke | 1/3 |
| Health metadata | `examiner-victoria-v2` | `examiner-victoria` | health route, smoke, API contract | Medium | exact response tests; no extra fields | 1 |
| Release history | V2 names/tags/URLs | unchanged | historical docs/config references | Low | tag/Release audit | none |

## 9. Exact path migration map

### 9.1 Frontend: 50 tracked moves

```text
v2/frontend/.env.example -> frontend/.env.example
v2/frontend/ARCHITECTURE.md -> frontend/ARCHITECTURE.md
v2/frontend/index.html -> frontend/index.html
v2/frontend/package.json -> frontend/package.json
v2/frontend/pnpm-lock.yaml -> frontend/pnpm-lock.yaml
v2/frontend/pnpm-workspace.yaml -> frontend/pnpm-workspace.yaml
v2/frontend/public/manifest.webmanifest -> frontend/public/manifest.webmanifest
v2/frontend/public/victoria-icon.svg -> frontend/public/victoria-icon.svg
v2/frontend/smoke_test.js -> frontend/smoke_test.js
v2/frontend/src/App.jsx -> frontend/src/App.jsx
v2/frontend/src/api.js -> frontend/src/api.js
v2/frontend/src/browserSpeechTranscriber.js -> frontend/src/browserSpeechTranscriber.js
v2/frontend/src/components/layout/AnswerComposer.jsx -> frontend/src/components/layout/AnswerComposer.jsx
v2/frontend/src/components/layout/ChatPanel.jsx -> frontend/src/components/layout/ChatPanel.jsx
v2/frontend/src/components/layout/ExamHeader.jsx -> frontend/src/components/layout/ExamHeader.jsx
v2/frontend/src/components/layout/ExamStageCard.jsx -> frontend/src/components/layout/ExamStageCard.jsx
v2/frontend/src/components/layout/MobileToasts.jsx -> frontend/src/components/layout/MobileToasts.jsx
v2/frontend/src/components/layout/PendingSpeechCard.jsx -> frontend/src/components/layout/PendingSpeechCard.jsx
v2/frontend/src/components/layout/RuntimeDiagnosticsPanel.jsx -> frontend/src/components/layout/RuntimeDiagnosticsPanel.jsx
v2/frontend/src/components/layout/StageSummary.jsx -> frontend/src/components/layout/StageSummary.jsx
v2/frontend/src/components/messages/MessageViews.jsx -> frontend/src/components/messages/MessageViews.jsx
v2/frontend/src/config/appConfig.js -> frontend/src/config/appConfig.js
v2/frontend/src/hooks/useAnswerRecording.js -> frontend/src/hooks/useAnswerRecording.js
v2/frontend/src/hooks/useBrowserEffects.js -> frontend/src/hooks/useBrowserEffects.js
v2/frontend/src/hooks/useExamController.js -> frontend/src/hooks/useExamController.js
v2/frontend/src/hooks/useSpeechPlayback.js -> frontend/src/hooks/useSpeechPlayback.js
v2/frontend/src/main.jsx -> frontend/src/main.jsx
v2/frontend/src/recorder.js -> frontend/src/recorder.js
v2/frontend/src/state/actions.js -> frontend/src/state/actions.js
v2/frontend/src/state/appReducer.js -> frontend/src/state/appReducer.js
v2/frontend/src/state/initialState.js -> frontend/src/state/initialState.js
v2/frontend/src/state/selectors.js -> frontend/src/state/selectors.js
v2/frontend/src/styles.css -> frontend/src/styles.css
v2/frontend/src/styles/base.css -> frontend/src/styles/base.css
v2/frontend/src/styles/chat.css -> frontend/src/styles/chat.css
v2/frontend/src/styles/composer.css -> frontend/src/styles/composer.css
v2/frontend/src/styles/diagnostics.css -> frontend/src/styles/diagnostics.css
v2/frontend/src/styles/header.css -> frontend/src/styles/header.css
v2/frontend/src/styles/mobile.css -> frontend/src/styles/mobile.css
v2/frontend/src/styles/report.css -> frontend/src/styles/report.css
v2/frontend/src/styles/stage.css -> frontend/src/styles/stage.css
v2/frontend/src/utils/browser.js -> frontend/src/utils/browser.js
v2/frontend/src/utils/downloads.js -> frontend/src/utils/downloads.js
v2/frontend/src/utils/errors.js -> frontend/src/utils/errors.js
v2/frontend/src/utils/format.js -> frontend/src/utils/format.js
v2/frontend/src/utils/labels.js -> frontend/src/utils/labels.js
v2/frontend/src/utils/runtimeDiagnostics.js -> frontend/src/utils/runtimeDiagnostics.js
v2/frontend/src/utils/sessionStorage.js -> frontend/src/utils/sessionStorage.js
v2/frontend/src/utils/sessionView.js -> frontend/src/utils/sessionView.js
v2/frontend/vite.config.js -> frontend/vite.config.js
```

### 9.2 Backend: 27 tracked moves

```text
v2/backend/.env.example -> backend/.env.example
v2/backend/ARCHITECTURE.md -> backend/ARCHITECTURE.md
v2/backend/__init__.py -> backend/__init__.py
v2/backend/ai_provider.py -> backend/ai_provider.py
v2/backend/app.py -> backend/app.py
v2/backend/audio_services.py -> backend/audio_services.py
v2/backend/core/__init__.py -> backend/core/__init__.py
v2/backend/core/config.py -> backend/core/config.py
v2/backend/core/payload_limits.py -> backend/core/payload_limits.py
v2/backend/core/rate_limit.py -> backend/core/rate_limit.py
v2/backend/engine.py -> backend/engine.py
v2/backend/exam_flow_service.py -> backend/exam_flow_service.py
v2/backend/feedback_service.py -> backend/feedback_service.py
v2/backend/part3_service.py -> backend/part3_service.py
v2/backend/question_bank_service.py -> backend/question_bank_service.py
v2/backend/report_service.py -> backend/report_service.py
v2/backend/requirements.txt -> backend/requirements.txt
v2/backend/routes/__init__.py -> backend/routes/__init__.py
v2/backend/routes/answer.py -> backend/routes/answer.py
v2/backend/routes/audio.py -> backend/routes/audio.py
v2/backend/routes/health.py -> backend/routes/health.py
v2/backend/routes/report.py -> backend/routes/report.py
v2/backend/routes/sessions.py -> backend/routes/sessions.py
v2/backend/routes/telemetry.py -> backend/routes/telemetry.py
v2/backend/schemas.py -> backend/schemas.py
v2/backend/smoke_test.py -> backend/smoke_test.py
v2/backend/telemetry_service.py -> backend/telemetry_service.py
```

### 9.3 Scripts: 15 tracked moves, including two final renames

```text
v2/scripts/_common.ps1 -> scripts/_common.ps1
v2/scripts/check_deploy_config.ps1 -> scripts/check_deploy_config.ps1
v2/scripts/check_deployed_v2.ps1 -> scripts/check_deployed_app.ps1
v2/scripts/check_git_ready.ps1 -> scripts/check_git_ready.ps1
v2/scripts/check_local_preview.ps1 -> scripts/check_local_preview.ps1
v2/scripts/check_mobile_qa_result.ps1 -> scripts/check_mobile_qa_result.ps1
v2/scripts/check_v2.ps1 -> scripts/check_project.ps1
v2/scripts/generate_admin_token.ps1 -> scripts/generate_admin_token.ps1
v2/scripts/prepare_public_deploy_bundle.ps1 -> scripts/prepare_public_deploy_bundle.ps1
v2/scripts/run_backend.ps1 -> scripts/run_backend.ps1
v2/scripts/run_frontend.ps1 -> scripts/run_frontend.ps1
v2/scripts/run_local_stack.ps1 -> scripts/run_local_stack.ps1
v2/scripts/start_https_tunnel.ps1 -> scripts/start_https_tunnel.ps1
v2/scripts/stop_local_stack.ps1 -> scripts/stop_local_stack.ps1
v2/scripts/sync_public_deploy_github.ps1 -> scripts/sync_public_deploy_github.ps1
```

### 9.4 Active documentation moves and obsolete package marker

```text
v2/API_CONTRACT.md -> docs/API_CONTRACT.md
v2/CHECKLIST.md -> docs/CHANGE_CHECKLIST.md
v2/DEPLOYMENT.md -> docs/DEPLOYMENT.md
v2/MOBILE_QA.md -> docs/MOBILE_QA.md
v2/MOBILE_QA_RESULT.template.md -> docs/MOBILE_QA_RESULT.template.md
v2/README.md -> docs/APPLICATION.md
v2/RUN_LOCAL.md -> docs/RUN_LOCAL.md
v2/__init__.py -> delete after backend moves
v2/COMPLETION_AUDIT.md -> keep unchanged as frozen V2 evidence
```

### 9.5 Optional Phase 2 question-bank map

```text
question_bank.py -> backend/question_bank/catalog.py
pdf_recall_question_bank.py -> backend/question_bank/pdf_recall.py
backend/question_bank/__init__.py -> new package marker
validate_question_bank.py -> keep at root; update imports only
```

### 9.6 Exact non-move files expected to change

Deployment/config/current documentation outside the moved trees:

```text
.dockerignore
AGENTS.md
Dockerfile
README.md
deploy/vps/README.md
deploy/vps/docker-compose.yml
docs/DEVELOPMENT_WORKFLOW.md
docs/V3_CLOUDBASE_MIGRATION_PLAN.md
docs/V3_CURRENT_STATUS.md
docs/V3_MANUAL_TEST_CHECKLIST.md
docs/V3_RUNTIME_DEPENDENCIES.md
```

Files to inspect but normally leave unchanged:

```text
.gitignore
railway.json
render.yaml
deploy/vps/.env.example
deploy/vps/Caddyfile
frontend/pnpm-lock.yaml
frontend/pnpm-workspace.yaml
frontend/vite.config.js
frontend/src/config/appConfig.js       # preserve legacy storage key
backend/schemas.py                     # no session/API schema change
```

Affected-path estimate:

```text
92 core directory moves
+ 7 active documentation moves
+ 1 obsolete v2/__init__.py deletion
+ 11 external config/current-document updates
= 111 paths without Phase 2

111
+ 3 existing root question-bank/validator files
+ 1 new backend/question_bank/__init__.py
= 115 paths in the complete recommended end state
```

### 9.7 Exact content-edit ledger inside moved trees

Most tracked files are path-only moves. The files below are expected to change content as part of the named migration behavior; this list is separate from the 15-script treatment table in Section 11.

```text
backend/.env.example                    # neutral comment/path guidance
backend/ARCHITECTURE.md                 # package and entrypoint documentation
backend/__init__.py                     # neutral package description
backend/app.py                          # FastAPI title
backend/core/config.py                  # repository depth and local env path
backend/question_bank_service.py        # repository-root depth; Phase 2 import later
backend/routes/health.py                # neutral public app identifier
backend/smoke_test.py                   # 11 imports and metadata expectations
frontend/.env.example                   # neutral comment only
frontend/ARCHITECTURE.md                # current paths/commands
frontend/package.json                   # neutral private package name
frontend/smoke_test.js                  # deterministic neutral-metadata assertions
frontend/src/utils/downloads.js         # stable product name in exports
```

Phase 2 additionally changes `backend/question_bank_service.py`, root `validate_question_bank.py`, and the two moved bank modules' import relationship without changing any data. Deployment content edits are exactly `Dockerfile`, `.dockerignore`, and `deploy/vps/docker-compose.yml`; `deploy/vps/README.md` is a documentation update. `railway.json` and `render.yaml` are validation-only.

## 10. Python import migration map

The explicit import rewrite is narrow:

```text
import v2.backend.core.config                 -> import backend.core.config
import v2.backend.core.rate_limit             -> import backend.core.rate_limit
import v2.backend.audio_services              -> import backend.audio_services
import v2.backend.exam_flow_service            -> import backend.exam_flow_service
import v2.backend.feedback_service             -> import backend.feedback_service
import v2.backend.part3_service                -> import backend.part3_service
import v2.backend.report_service               -> import backend.report_service
import v2.backend.routes.audio                 -> import backend.routes.audio
from v2.backend.app                            -> from backend.app
from v2.backend.engine                         -> from backend.engine
from v2.backend.schemas                        -> from backend.schemas
```

Entrypoint strings become:

```text
v2.backend.app:app          -> backend.app:app
python -m v2.backend.smoke_test -> python -m backend.smoke_test
```

The five active entrypoint/assertion consumers are `Dockerfile`, `check_deploy_config.ps1`, `check_project.ps1`, `run_backend.ps1`, and `run_local_stack.ps1`. Historical documents retain their old commands as dated evidence; current documents get the new commands.

Relative imports under `backend/` remain unchanged. Do not convert them to a new import style during the path migration.

## 11. Script migration map

| Script | Required treatment | Historical name retained? |
| --- | --- | --- |
| `_common.ps1` | move; neutralize four functions/cache name | No |
| `check_deploy_config.ps1` | move; root/path/Docker markers/product labels | No |
| `check_deployed_v2.ps1` | rename; neutralize display label | No |
| `check_git_ready.ps1` | move; root calculation/product label | No |
| `check_local_preview.ps1` | move; root calculation/temp name/product label | No |
| `check_mobile_qa_result.ps1` | move; root/result paths/current acceptance wording | No |
| `check_v2.ps1` | rename; update 97 path occurrences, functions, tests, output | No |
| `generate_admin_token.ps1` | move only | No versioned name exists |
| `prepare_public_deploy_bundle.ps1` | move; root/include rules/bundle names | No |
| `run_backend.ps1` | move; root/functions/requirements/entrypoint | No |
| `run_frontend.ps1` | move; root/functions/frontend path | No |
| `run_local_stack.ps1` | move; root/functions/paths/entrypoint/temp files | No |
| `start_https_tunnel.ps1` | move; root/temp/help text | No |
| `stop_local_stack.ps1` | move; root/temp names with legacy fallback | No |
| `sync_public_deploy_github.ps1` | move; root/two functions/new repository/bundle names | No |

No active script should keep a V2 filename after Phase 3. Historical command text remains only in frozen historical documents.

## 12. Docker and CloudBase impact

### 12.1 Docker rewrite contract

Phase 1 must update all of the following atomically:

```text
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
COPY frontend/index.html frontend/vite.config.js ./
COPY frontend/public ./public
COPY frontend/src ./src
ENV FRONTEND_DIST=/app/frontend/dist
COPY backend/requirements.txt /tmp/backend-requirements.txt
COPY backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
CMD ... backend.app:app ...
```

Question-bank root `COPY` lines remain in Phase 1. Phase 2 removes the separate bank-module copies only after those modules live under `backend/question_bank/`; the root validator may remain copied only if a runtime/debug requirement is documented, otherwise it need not be in the production image.

### 12.2 CloudBase actions

No new service, source branch, repository, domain, port, or health path is required. The formal Phase 1 deployment needs at least three human CloudBase actions:

1. create/build a new version from the merged `main` commit while retaining the currently verified version;
2. verify build metadata, health, diagnostics, static UI, and controlled flows on the new version;
3. switch or confirm production traffic only after acceptance.

One additional conditional action is required if the console explicitly overrides `FRONTEND_DIST` or the container start command: change it to `/app/frontend/dist` or `backend.app:app`. Do not assume such an override exists; inspect it without exposing other environment values.

If Phase 2 is deployed separately, repeat the three version/build/verification/traffic actions. Phase 3 is local tooling/documentation and normally does not require a CloudBase deployment.

## 13. Question-bank decision

**Decision:** keep all three root files unchanged during Phase 1. After the new backend package is stable, move only the two bank modules to `backend/question_bank/` in Phase 2 and keep `validate_question_bank.py` as the documented root command.

Why not `data/`:

- the files contain Python symbols and import behavior, not passive assets;
- the backend owns their runtime use;
- a generic root `data/` makes package/import boundaries less clear.

Phase 2 impacts:

- `backend/question_bank_service.py` imports;
- `validate_question_bank.py` imports;
- Docker copy rules;
- `scripts/check_project.ps1` compile/validation and bundle assertions;
- `scripts/prepare_public_deploy_bundle.ps1` inclusion rules;
- backend smoke question counts and practice-option checks.

Do not modify question text, selection rules, counts, Prompt, or schemas.

## 14. Documentation impact

### Current facts to update or relocate

```text
README.md
AGENTS.md
docs/DEVELOPMENT_WORKFLOW.md
docs/V3_CURRENT_STATUS.md
docs/V3_CLOUDBASE_MIGRATION_PLAN.md        # update only active-reference sections
docs/V3_RUNTIME_DEPENDENCIES.md
docs/V3_MANUAL_TEST_CHECKLIST.md
v2/README.md -> docs/APPLICATION.md
v2/API_CONTRACT.md -> docs/API_CONTRACT.md
v2/DEPLOYMENT.md -> docs/DEPLOYMENT.md
v2/RUN_LOCAL.md -> docs/RUN_LOCAL.md
v2/CHECKLIST.md -> docs/CHANGE_CHECKLIST.md
v2/MOBILE_QA.md -> docs/MOBILE_QA.md
v2/MOBILE_QA_RESULT.template.md -> docs/MOBILE_QA_RESULT.template.md
frontend/ARCHITECTURE.md
backend/ARCHITECTURE.md
frontend/.env.example                    # comment only
backend/.env.example                     # comment/path guidance only
deploy/vps/README.md
```

### Historical facts to preserve without mechanical replacement

```text
v2/COMPLETION_AUDIT.md
docs/V2_FINAL_QA_CHECKLIST.md
docs/V3_KICKOFF_CONTEXT.md
docs/V3_BETA_ACCESS_TEST_LOG.md
docs/V3_DOMESTIC_ACCESS_AUDIT.md
docs/USER_FEEDBACK_LOG.md historical V2 references
V2 Release and tag references
frozen Railway V2 URL/service name
historical PR and commit references
```

`docs/V3_KICKOFF_CONTEXT.md` contains 29 baseline path occurrences and three package references, but they describe the kickoff snapshot and should remain unchanged. Current documentation should link to the new paths and explicitly identify old path examples as historical where necessary.

## 15. Phased implementation plan

### Phase 1 — core directory neutralization

Scope:

1. `git mv v2/frontend frontend` and `git mv v2/backend backend`.
2. Delete obsolete `v2/__init__.py`; keep `backend/__init__.py` with neutral text.
3. Rewrite 11 smoke-test imports and all five active module entrypoint consumers.
4. Correct `ROOT_DIR`, local `.env`, and root question-bank path depth.
5. Update Dockerfile, `.dockerignore`, VPS `FRONTEND_DIST`, and deploy assertions.
6. Neutralize FastAPI title, health/diagnostics app identifier, package name, export headings, and current architecture comments.
7. Preserve the localStorage key and question-bank root location.
8. Update only current documentation required to operate and deploy Phase 1.
9. Build and manually verify a new CloudBase version before branch cleanup.

Gate: no active runtime/search reference may require `v2/frontend`, `v2/backend`, or `v2.backend`; historical documents are allowlisted.

### Phase 2 — question bank and data organization

Start only after Phase 1 CloudBase acceptance. Move the two Python bank modules into `backend/question_bank/`, keep the validator at root, and update imports/copy/check rules. Verify identical question-bank counts and deterministic practice options. If there is no concrete maintenance benefit after Phase 1, Phase 2 may remain deferred indefinitely.

### Phase 3 — scripts, tests, and active documentation

1. Stop any old local stack/tunnel.
2. Move all 15 scripts to root `scripts/`.
3. Rename two scripts and six functions.
4. Change two-level root resolution to one-level resolution.
5. Neutralize temp/bundle/repository/product labels with one-cycle legacy cleanup compatibility.
6. Move seven active `v2/` documents into `docs/` and update their links/commands.
7. Leave `v2/COMPLETION_AUDIT.md` unchanged as frozen evidence.
8. Run the final end-state validation matrix.

Each phase must be a separate PR to `main`. Do not begin the next phase until the previous PR is merged, deployed when relevant, and proven rollback-safe.

## 16. Formal migration test matrix

Final end-state commands:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\check_project.ps1 -SkipInstall
python .\validate_question_bank.py
python -m backend.smoke_test
cd frontend
pnpm run test:smoke
pnpm run build
cd ..
powershell.exe -ExecutionPolicy Bypass -File .\scripts\check_deploy_config.ps1
git diff --check
```

During Phase 1, before scripts move, use the existing `v2/scripts/check_v2.ps1` with updated source paths; the final gate must use `scripts/check_project.ps1`.

Required evidence:

| Layer | Required proof |
| --- | --- |
| Python | compile all backend modules; import `backend.app`; no active `v2.backend` imports |
| Backend smoke | health, diagnostics, question bank, sessions, answer, report, telemetry, limits, deterministic LLM/STT/TTS mocks |
| Frontend | smoke PASS and production build PASS from `frontend/` |
| Static serving | root HTML, assets, direct asset requests, and SPA fallback |
| Docker | image builds from root; container listens on `8080`; no missing COPY path |
| API | `/api/health` and `/api/diagnostics/runtime` return safe fields; metadata values neutral |
| Product regression | Practice Part 1 and Mock Full deterministic flows pass |
| Question bank | validator and count endpoints are identical to baseline |
| Session compatibility | schema unchanged; legacy localStorage key still restores existing browser state |
| Scripts | all PowerShell files parse; project/deploy/local/deployed checks use neutral paths |
| Security | no Secret values, `.env`, recordings, answers, transcripts, or full environment dumps in diff/logs |
| Repository | only planned moves/edits; `git diff --check`; historical allowlist untouched |

Automated migration tests must never call real LLM, STT, or TTS providers.

## 17. Deployment plan

1. Merge the approved implementation phase PR into `main`.
2. Retain the current known-good CloudBase version and its build metadata.
3. Build a new CloudBase version from the exact merged commit.
4. Do not delete or overwrite the old version.
5. Verify `/api/health`, `/api/diagnostics/runtime`, React HTML/assets, SPA fallback, Practice Part 1, Mock Full, and one explicitly authorized STT/LLM/TTS flow.
6. Confirm the deployed `git_sha` and source branch.
7. Switch or confirm traffic only after acceptance.
8. Observe logs for path/import/static-file errors without recording request bodies or user content.
9. Delete the merged task branch only after deployment verification and no-unique-commit proof.

Phase 1 and optional Phase 2 each require their own CloudBase version. Phase 3 normally does not.

## 18. Rollback plan

Preferred runtime rollback:

1. route CloudBase traffic back to the retained known-good version;
2. confirm old health, diagnostics, and UI;
3. revert the migration PR on `main` with a normal reviewed revert;
4. rebuild only after the revert is merged.

Do not force push, reset `main`, rebase published history, delete old tags/Releases, or overwrite CloudBase versions. Current sessions require no database rollback because the application has no database and the session schema remains unchanged. Preserving the legacy localStorage key avoids invalidating browser-restored sessions.

Local rollback is a fresh checkout of the reverted `main`; do not manually move directories back. Ignored local `.env`, dependency, and cache directories must remain outside Git and be handled without displaying their contents.

## 19. Risk register

The five highest-risk positions are:

| Rank | Position | Failure mode | Mitigation |
| ---: | --- | --- | --- |
| 1 | `Dockerfile` COPY/CMD/`FRONTEND_DIST` | Cloud build succeeds partially or container cannot start/serve assets | atomic rewrite; image/container/static tests; retained CloudBase version |
| 2 | `backend/core/config.py` and `question_bank_service.py` path depth | env/frontend/question-bank resolution points to wrong directory | focused path tests from repo root and installed container |
| 3 | `backend/smoke_test.py` and runtime module entrypoints | duplicate/missing Python package identity or import failure | 11-import rewrite, zero-active-reference grep, module smoke |
| 4 | `check_project.ps1`, `_common.ps1`, and `run_local_stack.ps1` | wrong repo root, missing dependencies, stale PID/cache files | separate Phase 3; PowerShell parse; legacy cleanup fallback |
| 5 | CloudBase version/config override | image uses new paths while console forces old dist/start path | human override check, new version, no early traffic switch, old-version rollback |

Additional risks:

- renaming the localStorage key would hide existing local sessions — explicitly prohibited in structural phases;
- moving question-bank modules too early can alter counts/import order — deferred Phase 2;
- mechanical V2 replacement can corrupt release history — use current/historical allowlists;
- ignored local dependencies and `.env` do not follow Git moves — document local migration without reading values;
- stale `sync_public_deploy_github.ps1` repository defaults can target the renamed repository incorrectly — neutralize in Phase 3 and test with dry/read-only checks first.

## 20. Decision thresholds and go/no-go checklist

| Question | Answer |
| --- | --- |
| Execute now? | **Yes, conditionally**, after this plan is merged and a CloudBase verification window is available |
| One implementation PR? | **No**; use three PRs/phases |
| Must split? | Core runtime/CloudBase, optional question bank, scripts/docs |
| Overall risk | Medium-high, concentrated in Phase 1 |
| Human CloudBase work | Minimum 3 actions for Phase 1; 3 more if Phase 2 deploys separately; 1 conditional override update |
| API Contract change? | No endpoint/schema change; intentional `app` metadata value change must be documented/tested |
| Product behavior change? | No |
| Existing sessions affected? | No, provided schema and legacy localStorage key remain unchanged |
| New Tag required? | No |
| Update existing Beta 1 Release Notes? | No; do not rewrite the published Release. Mention the refactor in the next release notes if desired |

GO only when all are true:

- clean `main`, no concurrent path-sensitive feature branch;
- baseline local smoke/build/checks pass;
- exact move list reviewed;
- CloudBase current version identified and retained;
- rollback owner and acceptance window identified;
- no real `.env` or generated files are staged;
- Phase 1 diff contains no Prompt, question content, provider, schema, scoring, or UI-flow change.

NO-GO if:

- Docker cannot be built locally or in an equivalent builder;
- current CloudBase version cannot be retained for rollback;
- console start/path overrides cannot be inspected safely;
- import/path tests leave ambiguous dual packages;
- unrelated product changes are mixed into the migration PR.

## 21. Explicit non-goals

- no Nx, Turborepo, Bazel, Poetry, uv, or pnpm-workspace redesign;
- no Docker Compose production redesign, Kubernetes, microservices, or repository split;
- no new database, account, payment, or CI platform;
- no Prompt, question-bank content, scoring, Practice/Mock, Provider, or session-schema change;
- no local canonical folder rename;
- no CloudBase/Railway console operation during Phase 0;
- no tag, Release, or historical-record rewrite;
- no runtime migration in this audit PR.

## 22. Recommended next Codex task

After this document PR is reviewed and merged, open a new task titled:

> **Examiner Victoria Phase 1: move frontend/backend to version-neutral roots**

That task should implement only Phase 1, use the exact 77-file frontend/backend move map above, update the explicitly listed runtime/deployment consumers, preserve root question-bank modules and the legacy localStorage key, run the full Phase 1 test matrix including a Docker container smoke, and open a Draft PR to `main`. It must stop before CloudBase deployment; deployment remains a separately authorized human step.
