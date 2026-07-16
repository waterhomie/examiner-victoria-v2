# Examiner Victoria V3 Beta — Current Status

> Authoritative current-state reference.

## 1. Status date

This status was updated on **2026-07-16** after V3 promotion to `main`, the main-based CloudBase verification reported by the project owner, the V3 Beta tag and Pre-release, the GitHub repository rename, Phase 1 runtime-path neutralization, Phase 3 tooling/document neutralization, and the Phase 2 backend question-bank package migration implemented by the current change.

## 2. Product stage

Examiner Victoria is in the **V3 Beta** stage. The product is ready for small, targeted invitation testing; it is not presented as a broad public release or as market validation.

## 3. Current release line

- Current repository: `waterhomie/examiner-victoria`
- Default and development branch: `main`
- Promotion PR: [#20](https://github.com/waterhomie/examiner-victoria/pull/20), merged
- Promotion merge commit: `b02dd1da2ddf768fd659a29b9f54797a6a025668`
- Current tag: `v3.0.0-beta.1`
- GitHub Pre-release: [Examiner Victoria V3.0.0 Beta 1](https://github.com/waterhomie/examiner-victoria/releases/tag/v3.0.0-beta.1)
- The former `v3/domestic-public-beta` integration branch is retired and deleted

New work branches from `main` and returns to `main` through review.

## 4. Frozen V2 baseline and repository compatibility

- Tag: `v2.0.0`
- Frozen commit: `d592900e29c0cdcc4576d884c178991deea7013c`
- The original V2 Railway deployment remains a historical reference and rollback option
- V2 history is preserved by its tag, commit, QA evidence, and Release; `main` is now the V3 line

The current GitHub repository is `waterhomie/examiner-victoria`. Its former name was `waterhomie/examiner-victoria-v2`; GitHub redirects old URLs, but current documentation and Git remotes use the new name.

The active React application is in top-level `frontend/`, and the active FastAPI application is in top-level `backend/`. The production entrypoint is `backend.app:app`, and FastAPI serves the build from `frontend/dist`. The canonical local worktree folder keeps its historical name.

Current PowerShell tooling is in top-level `scripts/`, current run/deployment guides are in `docs/`, and question-bank data is in `backend/question_bank/`. The root `validate_question_bank.py` remains the stable validation entry, while the former root data modules are removed. The `v2/` directory contains frozen historical evidence only. Phase 0, Phase 1, Phase 3, and Phase 2 are complete, ending the planned repository-structure migration.

## 5. Current architecture

- Frontend: React 19, Vite, and pnpm in `frontend/`
- Backend: FastAPI and Pydantic in `backend/` (`backend.app:app`)
- Question bank: explicit package exports and source data in `backend/question_bank/`, with root `validate_question_bank.py` retained
- Packaging: one Docker container
- Serving model: FastAPI serves the built frontend and `/api` routes
- Sessions: held by the frontend and passed through API requests
- Persistence: no account system and no application database

## 6. Current deployment

The current domestic beta entry is Tencent CloudBase Run in Shanghai:

- Service: `examiner-victoria-v3-beta`
- Source repository: `waterhomie/examiner-victoria`
- Source branch: `main`
- URL: <https://examiner-victoria-v3-beta-281197-7-1330057446.sh.run.tcloudbase.com>
- Health: <https://examiner-victoria-v3-beta-281197-7-1330057446.sh.run.tcloudbase.com/api/health>
- Runtime diagnostics: <https://examiner-victoria-v3-beta-281197-7-1330057446.sh.run.tcloudbase.com/api/diagnostics/runtime>

The project owner manually changed CloudBase to build from `main`, deployed the main-based version, and reported that the homepage and core product flow passed manual verification. This document records that owner-provided result; it is not a claim that Codex operated or independently inspected the CloudBase console.

CloudBase deployment and source-branch changes remain human-controlled. Railway is not the primary domestic V3 entry. The V2 Railway service is a frozen historical/rollback reference, while the V3 Railway beta was an overseas test baseline.

## 7. Verified domestic access scope

With VPN disabled, the CloudBase deployment has been verified on:

- iPhone over Wi-Fi
- iPhone over 4G
- Safari
- WeChat embedded browser
- HTTPS and secure context
- microphone permission, recording, local audio playback, and local storage
- `/api/transcribe`, `/api/answer`, and `/api/tts`

These observations do not establish coverage for 5G, every Android model, every carrier, high concurrency, or broad public traffic.

## 8. Provider status

- LLM: the existing OpenAI-compatible provider path remains in use
- STT: the existing server transcription provider remains in use, with browser capability checks and fallback behavior
- TTS on CloudBase: Tencent Cloud TextToVoice through the official Python SDK and the project provider adapter
- gTTS: explicit local/legacy provider only; it is not the current CloudBase TTS path
- Text fallback: retained when TTS is disabled, times out, or fails; a voice failure must not remove feedback or the next question

Provider credentials are configured only through the deployment secret store. Documentation records variable names and non-sensitive public options, never credential values.

## 9. Current product capabilities

- Practice and Mock modes
- Part 1, Part 2, Part 3, and Full speaking flows
- voice-first Mock experience
- direct-topic Part 1 practice with up to four non-duplicate questions
- recording, STT transcription, LLM feedback, and Tencent TTS playback
- feedback reports, transcripts, practice records, export, and download
- runtime/build diagnostics and the user-facing System check
- text-first degradation when voice generation is unavailable
- mobile H5 operation and anonymous feedback collection

## 10. Recent V3 changes

- established and manually verified the CloudBase domestic beta deployment
- added runtime/build diagnostics and System check
- isolated TTS failures from the answer flow and added non-sensitive timing diagnostics
- integrated Tencent Cloud TTS with least-privilege credential guidance
- made Practice Part 1 start directly from the selected or random topic
- completed the first invitation round with five anonymous testers
- promoted V3 to `main` through PR #20
- created tag and Pre-release `v3.0.0-beta.1`
- renamed the GitHub repository to `waterhomie/examiner-victoria`
- retired the merged feedback, release-consolidation, and V3 integration branches
- completed Phase 1 runtime-path neutralization and Phase 3 script/active-document neutralization
- moved the curated and PDF-recall question-bank modules into `backend/question_bank/` without changing data, order, counts, API behavior, Prompt, or Provider behavior

## 11. Testing status

The first invitation-testing target of 3–5 people has been reached:

- anonymous testers: T001–T005
- feedback records: F001–F016

The next step is targeted follow-up validation of fixes, mobile stability, provider latency, and cost. These results are product feedback and operational evidence, not a claim of statistical coverage or market validation.

## 12. Current boundaries and non-goals

V3 Beta does not currently include:

- accounts or cross-device identity
- a persistent application database
- payments
- a WeChat Mini Program release
- full-duplex real-time voice conversation
- acoustic pronunciation scoring
- long-term learner profiles
- persistent personal experiences or a personalized full-answer flow

These items require separate product decisions and must not be added incidentally.

## 13. Known risks and open validation

- CloudBase deployment-version selection remains human-controlled
- provider latency, egress reliability, quotas, and monthly spend need continued observation
- WeChat and iOS media behavior can vary by device and OS version
- Android, carrier, 5G, and concurrency coverage remain incomplete
- anonymous beta feedback must continue to avoid collecting unnecessary personal data
- vendor pricing, filing requirements, and platform policy must be checked against current official sources before decisions are made

## 14. Current development workflow

1. fast-forward a clean local `main`
2. create a short-lived task branch from `main`
3. make only the authorized change
4. run deterministic validation
5. commit and push the task branch
6. open a PR to `main`
7. merge only after review
8. deploy or verify when relevant
9. confirm the merged branch has no unique commits, then delete it

Do not commit directly to `main`. See [Development Workflow](DEVELOPMENT_WORKFLOW.md) and the repository [AGENTS.md](../AGENTS.md).

## 15. V3 promotion completed

V3 promotion was completed on 2026-07-13:

1. PR #20 promoted the V3 integration line to `main`
2. merge commit `b02dd1da2ddf768fd659a29b9f54797a6a025668` became the main release commit
3. the project owner changed CloudBase to build from `main`
4. the owner deployed and manually verified the main-based version
5. annotated tag `v3.0.0-beta.1` was created on the merge commit
6. the matching GitHub Pre-release was published

The former V3 integration branch is no longer a task base or deployment source.

## 16. Repository rename completed

The GitHub repository was renamed on 2026-07-13:

- current name: `waterhomie/examiner-victoria`
- former name: `waterhomie/examiner-victoria-v2`
- current Git remote and documentation links use the new repository name
- GitHub may redirect former URLs for historical compatibility
- local worktree folder names were not changed
- active runtime and tooling use `frontend/`, `backend/`, `backend/question_bank/`, and `scripts/`; current operating guides use `docs/`; `v2/` contains frozen historical evidence only; the planned three-phase structure migration is complete

## 17. Documentation authority

For current decisions, use this order:

1. root [README](../README.md) — public project overview
2. this document — authoritative current V3 state
3. [User Feedback Log](USER_FEEDBACK_LOG.md) — tester evidence and decisions
4. [AGENTS.md](../AGENTS.md) — AI collaboration rules
5. [Development Workflow](DEVELOPMENT_WORKFLOW.md) — Git and maintenance workflow
6. other V3 migration, audit, diagnostic, and test documents — specialized evidence or historical snapshots

When an older planning document conflicts with this file, this file takes precedence unless newer code or reviewed deployment evidence proves otherwise.

## 18. Historical and specialized document index

- [V3 Kickoff Context](V3_KICKOFF_CONTEXT.md) — historical kickoff snapshot
- [Domestic Access Audit](V3_DOMESTIC_ACCESS_AUDIT.md) — historical migration audit
- [Beta Access Test Log](V3_BETA_ACCESS_TEST_LOG.md) — access-test evidence, including Railway-era checks
- [CloudBase Migration Plan](V3_CLOUDBASE_MIGRATION_PLAN.md) — migration record with active operational references
- [Runtime Dependencies](V3_RUNTIME_DEPENDENCIES.md) — current provider and runtime dependency details
- [Local Run Guide](RUN_LOCAL.md) — current local commands
- [Deployment Guide](DEPLOYMENT.md) — current deployment contract and rollback context
- [Runtime Diagnostics](V3_RUNTIME_DIAGNOSTICS.md) — diagnostics design and safety contract
- [Build Version Diagnostics](V3_BUILD_VERSION_DIAGNOSTICS.md) — build identity fields and deployment inputs
- [Manual Test Checklist](V3_MANUAL_TEST_CHECKLIST.md) — current manual acceptance checklist
- [V3 Beta Constraints](V3_BETA_CONSTRAINTS.md) — active scope and cost boundaries
- [V2 Final QA Checklist](V2_FINAL_QA_CHECKLIST.md) and `v2/` completion records — frozen V2 evidence
