# Codex Instructions for Examiner Victoria V2

These rules apply to AI coding agents working in this repository.

## Repository Boundary

Use this Git repository as the default working scope:

```text
D:\Software\Codex\Projects\examiner-victoria-v2-canonical
```

Do not use old `tmp/github-sync-*` clones for new development. Do not modify old
workspaces unless the user explicitly asks for a migration or audit step.

## Start Every Task

Before making changes, inspect:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git remote -v
```

If the task affects deployment, also inspect `railway.json`, `Dockerfile`, and
`v2/DEPLOYMENT.md`.

## Branch Discipline

Do not commit directly on `main`. Create a task branch, test, commit, push the
branch, and let the user decide PR/merge timing.

## Secret and Privacy Rules

- Do not read, print, copy, or commit real `.env` contents.
- Do not commit API keys, admin tokens, GitHub tokens, provider keys, or private
  feedback data.
- Do not commit real user names, answers, transcripts, audio, telemetry dumps,
  logs, or tunnel URLs.
- Do not place secrets in frontend `VITE_*` variables.

## Product Boundaries

V2 is the current production and main development version. V1 Streamlit is a
frozen historical prototype. Do not add V1 features.

Do not change these without explicit user confirmation:

- prompts
- question-bank content
- IELTS state machine
- STT/TTS behavior
- report/scoring behavior
- API contract
- deployment settings
- major UI interaction flows

## Testing

Before commit, run the relevant deterministic checks. For most V2 changes:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\check_v2.ps1 -SkipInstall
```

For deployment-only changes:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\check_deploy_config.ps1
```

Do not call real LLM, STT, TTS, payment, telemetry-write, or production-mutating
services unless the user explicitly asks for that test.

## Commits

Commit only intentional files. Keep commits small. Do not include:

- `node_modules`
- `dist`
- `tmp`
- caches
- logs
- generated local QA files with private data

## Human Confirmation Required

Stop and ask before:

- merging to `main`
- modifying Railway settings
- pushing production-sensitive changes if tests failed
- deleting or moving historical files
- changing persistent data, user privacy, or deployment topology
- starting Phase 3 or later migration work
