# V3 Build Version Diagnostics

The public `GET /api/diagnostics/runtime` response includes these deployment identification fields:

- `git_sha`
- `git_sha_short`
- `build_time`
- `deploy_target`
- `app_version`
- `source_branch`

The backend reads them only from the explicitly named environment variables below. It does not execute Git commands or inspect the `.git` directory at runtime. Missing, blank, overlong, or unsafe values are reported as `unknown`, and missing metadata never prevents the application from starting.

For each manual CloudBase deployment, set these non-sensitive labels for the merged revision being deployed:

```text
APP_GIT_SHA=<merged commit SHA>
APP_BUILD_TIME=<ISO 8601 timestamp, for example 2026-07-13T08:30:00Z>
APP_DEPLOY_TARGET=cloudbase
APP_SOURCE_BRANCH=v3/domestic-public-beta
APP_VERSION=v3-beta
```

These are public deployment labels, not secrets. Never place API keys, tokens, credentials, signed URLs, or other sensitive values in them.

After deployment, request `/api/diagnostics/runtime` and compare `git_sha` with the intended merged commit before starting provider tests. CloudBase automatic deployment is currently disabled, so these values must be updated as part of each user-controlled manual version deployment.
