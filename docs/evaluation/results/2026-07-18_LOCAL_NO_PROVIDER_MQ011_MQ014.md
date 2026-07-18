# Local no-provider evaluation: MQ-011—MQ-014

Related baseline:

- [V3 minimal quality test set](../V3_MINIMAL_QUALITY_TEST_SET.md)
- [Evaluation run template](../V3_MINIMAL_QUALITY_RUN_TEMPLATE.md)

## Scope

- Date: 2026-07-18
- Evaluated commit: f996ede00a6805c17e6458ac8cb9f9f23b5735ec
- Evaluation branch: test/v3-minimal-quality-no-provider-run
- Cases: MQ-011, MQ-012, MQ-013, MQ-014
- Provider usage: none
- Inputs: synthetic test data only
- User data: none
- Human tester count: 0
- Market or production quality claim: none

This is a local recovery-path evaluation, not a production acceptance test. The test snapshot was generated from the evaluated Git commit and verified not to contain root or backend .env files. The canonical worktree environment file was not read.

## Environment

- Python 3.14.6 in a repository-local ignored virtual environment
- Node.js 24.18
- pnpm 11.9
- Backend exercised through FastAPI TestClient in a sanitized Git snapshot
- Frontend recovery contracts checked by the existing smoke suite and focused source assertions

## General validation

| Check | Result | Evidence |
| --- | --- | --- |
| Backend smoke | Pass | FastAPI smoke test passed |
| Frontend smoke | Pass | Frontend smoke test passed |
| Frontend STT retry contract | Pass | Retry state retains the last recording and exposes retry |
| Frontend text fallback contract | Pass | Text mode and busy-state recovery paths remain present |
| Frontend TTS failure state preservation | Pass | Existing smoke assertion passed |
| Real LLM, STT, or TTS call | None | All external stages were replaced with deterministic local mocks |
| Secret or real user-data use | None | No environment values, recordings, answers, or transcripts were read |

## Case results

| Case | Scenario | Result | Key observation |
| --- | --- | --- | --- |
| MQ-011 | STT failure followed by retry | Pass | Initial failures returned safe 502 responses in 823 ms; retry returned 200 and the client-held session remained intact |
| MQ-012 | LLM feedback and Part 3 generation failure | Pass | Both answer requests returned 200; the answer and next question remained available; Part 3 used its fallback source |
| MQ-013 | TTS timeout after text results exist | Pass | TTS returned 504 in 61 ms; text, next question, and session remained intact; the dedicated voice-unavailable message was used and the server-waking message was absent |
| MQ-014 | Report-model failure | Pass | Report returned 200 with the rule-based fallback, saved-session evidence, and all required report sections |

## Focused evidence

### MQ-011

- Failure duration: 823 ms
- Failure status: 502
- Retry status: 200
- Session preserved: yes
- The STT mock failed deterministically before succeeding on the retry. No audio left the local test process.

### MQ-012

- Feedback-failure answer status: 200
- Answer preserved: yes
- Next question preserved: yes
- Part 3 failure answer status: 200
- Part 3 source: fallback
- Both LLM-dependent paths used deterministic exceptions. The normal text answer flow remained usable.

### MQ-013

- Status: 504
- Duration: 61 ms with a 50 ms injected timeout
- Text preserved: yes
- Next question preserved: yes
- Session preserved: yes
- Dedicated message present: Voice is temporarily unavailable. Continue with the text shown above.
- Incorrect server-waking message present: no

### MQ-014

- Status: 200
- Rule-based fallback marker present: yes
- Saved-session evidence used: yes
- Required sections present:
  - Overall band estimate
  - Skill breakdown
  - Corrected examples
  - Next-session practice tasks
  - Session learning summary

## Decision

Local no-provider recovery subset: Pass

- Passed cases: 4 of 4
- Failed cases: 0
- Critical violations: 0
- Paid provider calls: 0
- Business-code changes made for this evaluation: none

## Limitations

This result does not evaluate MQ-001—MQ-010, real provider quality, provider latency, production deployment, browser media permissions, mobile playback, or real-user behavior. It must not be interpreted as a full V3 release acceptance result.

A separate, explicitly authorized text-only pilot can next cover MQ-001—MQ-008 with sound disabled. Real-provider and mobile-browser verification should remain a distinct controlled phase.

## Maintenance note

The backend smoke run emitted a Starlette TestClient deprecation warning concerning its current httpx integration. It did not affect this evaluation result, but it should be handled as a separate dependency-maintenance task.
