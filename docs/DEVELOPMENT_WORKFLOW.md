# Development Workflow

This document defines the safe maintenance workflow for Examiner Victoria V2.

## Canonical Directory

Always operate from the root of the currently opened Git repository.

On the primary Windows development machine, the canonical local path is:

```text
D:\Software\Codex\Projects\examiner-victoria-v2-canonical
```

The old workspace and old `tmp/github-sync-*` directories are historical
evidence and should not be used for new feature work.

## Branches

`main` is the production branch connected to Railway. Do not commit directly on
`main`.

Use feature or maintenance branches:

```text
feature/<short-name>
fix/<short-name>
maintenance/<short-name>
docs/<short-name>
```

## Standard Flow

```text
check status -> create branch -> edit -> test -> commit -> push branch -> PR -> merge
```

Before editing:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git remote -v
```

## Tests

Use deterministic local checks before commit:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\check_v2.ps1 -SkipInstall
```

For deployment configuration:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\v2\scripts\check_deploy_config.ps1
```

Do not run checks that call real LLM, STT, TTS, production telemetry, or paid
providers unless the user explicitly asks for that test.

## Commit Rules

- Keep commits small and explainable.
- Commit only files needed for the task.
- Do not mix product changes, documentation cleanup, deployment changes, and
  repository migration in one commit unless the task explicitly requires it.
- Run `git diff --check` before commit.

## Push and PR

Push only the current working branch. Do not force push unless the user has
explicitly approved it.

Open a PR for review. Do not auto-merge. Railway auto deploy follows `main`, so
merging to `main` is a production-relevant action.

## Railway

Railway builds from repository root:

```text
Dockerfile
railway.json
```

Expected settings:

- Source Repo: `waterhomie/examiner-victoria-v2`
- Production Branch: `main`
- Root Directory: repository root / blank
- Config File Path, if present: `/railway.json`

Do not modify Railway settings without explicit user confirmation.

## Rollback

If a branch has not been merged, stop using it or delete the branch after
confirming with the user.

If a commit has been merged, prefer a normal revert commit or revert PR:

```powershell
git revert <commit-sha>
```

If production deploy fails, redeploy the previous known-good Railway deployment
or revert the merge commit and redeploy.

## Files That Must Not Enter Git

- real `.env` files
- API keys, admin tokens, GitHub tokens, provider secrets
- private feedback data
- real user names, user answers, or audio
- logs, PIDs, tunnel URLs
- `node_modules`
- `dist`
- caches and temporary files

## V1 Policy

V1 Streamlit is frozen. Do not add features to V1. Use it only as historical
reference or for narrowly scoped security/recovery checks.

## Large Changes

Wait for explicit user confirmation before:

- moving directories
- changing deployment settings
- changing API contracts
- changing prompt or scoring behavior
- changing question-bank content
- introducing persistence, payments, accounts, or Mini Program work
