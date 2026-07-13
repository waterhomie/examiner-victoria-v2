# Examiner Victoria project-level agent instructions

## Repository context

- Repository: `waterhomie/examiner-victoria`
- Default and development branch: `main`
- Current release: `v3.0.0-beta.1`
- Frozen V2 release: tag `v2.0.0`, commit `d592900e29c0cdcc4576d884c178991deea7013c`
- Canonical Windows worktree: `D:\Software\Codex\Projects\examiner-victoria-v2-canonical`
- Secondary Windows worktree: `D:\Software\Codex\Projects\examiner-victoria-v3`
- Authoritative current state: `docs/V3_CURRENT_STATUS.md`

The local folder names are historical and were not renamed with the GitHub repository. Do not infer repository or product version from a local folder name.

## Product and directory status

Examiner Victoria V3 Beta is the current `main` product line. The application remains under `v2/` for compatibility because imports, Docker paths, scripts, and tests rely on that directory. Do not move or rename `v2/` during ordinary maintenance.

V2 remains preserved by tag `v2.0.0`, its frozen commit, QA records, and Railway historical reference. `main` no longer represents the V2 branch.

## Branch discipline

For normal work:

1. update a clean local `main` with `git pull --ff-only`
2. create a short-lived task branch from `main`
3. make only the authorized changes
4. run focused deterministic validation
5. commit and push the task branch
6. open a PR with `main` as the base
7. merge only after review and explicit authorization
8. verify deployment when relevant
9. delete the merged task branch after confirming it has no unique commits

Do not commit directly to `main`. The former `v3/domestic-public-beta` integration branch is retired and must not be recreated as the default task base.

## Safe change boundaries

Before editing:

- inspect `git status --short --branch`
- preserve unrelated user changes
- do not read or print real `.env` values
- do not expose keys, tokens, cookies, credentials, user recordings, full answers, or transcripts
- use repository-local dependencies and existing scripts
- keep Prompt, question bank, scoring, Practice/Mock rules, and provider behavior unchanged unless the task explicitly authorizes them

Never use `git reset --hard`, `git clean`, force push, or history rewriting to work around a dirty worktree.

## Deployment awareness

The current domestic beta runs on Tencent CloudBase Run:

- service: `examiner-victoria-v3-beta`
- source repository: `waterhomie/examiner-victoria`
- source branch: `main`
- container port: `8080`
- health: `/api/health`
- diagnostics: `/api/diagnostics/runtime`

Before deployment-related work, inspect:

- `Dockerfile`
- `docs/V3_CURRENT_STATUS.md`
- `docs/V3_CLOUDBASE_MIGRATION_PLAN.md`
- `docs/V3_RUNTIME_DEPENDENCIES.md`
- `v2/DEPLOYMENT.md`
- the actual CloudBase version and source reported by the user

Do not assume Railway is the current domestic deployment. Railway V2 is a frozen historical/rollback reference, and Railway V3 is an overseas test baseline.

Do not change CloudBase or Railway settings, trigger a deployment, or create cloud resources unless explicitly authorized.

## Required human confirmation

Stop and request confirmation before:

- changing CloudBase console configuration or source branch
- renaming the repository again or changing the default branch
- changing Git remotes outside an explicitly authorized rename task
- moving or renaming `v2/` or local worktree folders
- deleting a Release or tag
- deleting a long-lived or unverified branch
- modifying Prompt, question bank, provider behavior, scoring, or core Practice/Mock flow
- adding accounts, databases, payment, a Mini Program, or other scope-expanding features

## Validation and delivery

For documentation work, at minimum:

- inspect the complete diff and `git diff --stat`
- run `git diff --check`
- check changed Markdown links
- scan changed files for accidental secrets and personal data
- confirm that only intended files changed

For code work, use the relevant compile, smoke, build, and focused regression tests documented by the repository.

Create commits and PRs only when authorized. Never auto-merge unless the user explicitly requests that exact action.
