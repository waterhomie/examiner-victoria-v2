# Examiner Victoria development workflow

> Current workflow for the `main` V3 Beta release line. See [V3 Current Status](V3_CURRENT_STATUS.md) for the authoritative product and deployment state.

## Repository and branch model

- Repository: `waterhomie/examiner-victoria`
- Default and development branch: `main`
- Current release tag: `v3.0.0-beta.1`
- Frozen V2 evidence: tag `v2.0.0`, commit `d592900e29c0cdcc4576d884c178991deea7013c`
- CloudBase source branch: `main`
- The former `v3/domestic-public-beta` integration branch is retired

## Normal task lifecycle

```text
main
  -> short-lived task branch
  -> deterministic tests
  -> intentional commit
  -> push
  -> PR to main
  -> review and merge
  -> deployment verification when relevant
  -> delete merged task branch
```

Detailed steps:

1. Confirm the repository, `main` branch, remote, and clean worktree.
2. Fast-forward `main` from `origin/main`.
3. Create a narrowly named task branch from `main`.
4. Inspect current code and documentation before making assumptions.
5. Change only the authorized scope.
6. Run focused deterministic validation and inspect the final diff.
7. Commit with an intentional message.
8. Push the task branch.
9. Open a PR to `main`.
10. Leave merge and deployment to an explicitly approved step.
11. After merge, verify the relevant runtime or deployment state.
12. Confirm the task branch has no unique commits, then remove it when authorized.

Do not mix unrelated UI, provider, deployment, and documentation changes into one PR. Do not commit directly to `main`.

## Deployment workflow

CloudBase Run in Shanghai is the current domestic beta entry. It now builds from `main`; the first main-based deployment was manually verified by the project owner.

Before any deployment task:

- verify the intended commit and source branch
- review `Dockerfile`, `v2/DEPLOYMENT.md`, and current V3 deployment documentation
- use build-version diagnostics when configured
- keep secrets in the CloudBase secret/configuration store
- verify `/api/health`, `/api/diagnostics/runtime`, the frontend, and the intended user flow
- record only non-sensitive deployment evidence

CloudBase source selection and deployment remain human-controlled. Railway instructions are retained for V2 rollback history and the V3 overseas test baseline; they are not the default domestic workflow.

## Release evidence

- `v2.0.0`: frozen V2 stable baseline and historical recovery point
- `v3.0.0-beta.1`: current V3 Beta release and main-promotion evidence
- GitHub Releases: public version notes; do not delete or rewrite without confirmation
- CloudBase versions: deployment rollback points controlled in the CloudBase console
- Railway V2: historical external reference

## Rollback policy

Prefer reversible operations:

- use CloudBase version or traffic rollback for a bad deployment
- revert a faulty Git commit or PR instead of rewriting history
- retain release tags and GitHub Releases as version evidence
- preserve a failed task branch until its unique work is understood
- never use force push, destructive reset, or history deletion as routine rollback

Provider failure should degrade safely where supported. In particular, TTS failure must preserve written feedback and the next question.

## Documentation authority

Use documents in this order for current decisions:

1. root `README.md`
2. `docs/V3_CURRENT_STATUS.md`
3. `docs/USER_FEEDBACK_LOG.md`
4. `AGENTS.md`
5. this workflow
6. specialized or historical V3 audit, migration, diagnostic, and test records

Historical documents remain valuable evidence, but old repository, branch, deployment, or provider assumptions must not override the current-status reference.
