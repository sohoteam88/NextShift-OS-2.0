# OS 3.7 Command Center + Business Twin Release Manifest

Version: 3.7 RC  
Status: RC package prepared — awaiting review  
Last Updated: 2026-07-15

---

## Release Identity

| Field | Value |
| --- | --- |
| Release name | OS 3.7 Command Center + Business Twin |
| Theme | Command Center becomes business-aware |
| Source branch | `planning/os-3.3-runtime-platform` |
| Package branch | `release/os-3.7-rc-package` |
| Release package | `docs/nextshift-os-3/releases/OS_3_7_COMMAND_CENTER_TWIN/` |
| Recommended tag | `v3.7.0` |
| Tag status | Prepared, not created |
| Manifest baseline | `e39fee66cff6227dc4016e18f4cccc725ec51f8a` |

## Documentation Set

| Artifact | Purpose |
| --- | --- |
| [README](README.md) | RC entry point and scope |
| [Release Manifest](RELEASE_MANIFEST.md) | Hash-backed delivery registry |
| [Final Verification](FINAL_VERIFICATION.md) | Gates, audits, and C-3 runbook |
| [Release Notes](RELEASE_NOTES.md) | Capability summary and limitations |
| [Tag Preparation](TAG_PREPARATION.md) | Deferred tag plan |

## PR And Commit Evidence

The following hashes were resolved from `planning/os-3.3-runtime-platform` on 2026-07-15. PR #63 was rejected; it is recorded for range completeness and is not part of shipped source.

| PR | Merge / record hash | Workstream | Evidence |
| --- | --- | --- | --- |
| #63 | Rejected | C0 early attempt | Not shipped; superseded by #64/#65 |
| #64 | `e413696` | C0 brief | Base-branch brief and scope record |
| #65 | `4eb54ed` | C0 | Business Score domain-policy integration |
| #66 | `f253fc7` | C0 support | Domain root-barrel export repair |
| #67 | `a445606` | C1 | Approved Command Center information architecture |
| #68 | `0b0d645` | C2 | Read-only Weekly Review from existing memory |
| #69 | `f50b29e` + `201fca6` | T1 | Twin source wiring; boundaries fix and audit recovery |
| #70 | `23155e2` | T2 | Bounded Twin prompt summary injection |
| #71 | `0add4b8` | G1 | Onboarding friction diagnosis |
| #72 | `a026928` | F1 | Signup callback + dangling-account recovery |
| #73 | `69b334d` | G3 | Four legacy AI call sites routed through router |
| #74 | `865a105` | F2 | Twin deduplication and full-field bounds |
| Audit record | `9ba73c5`, `e39fee6` | Governance | Criterion #5 amendment and two 2026-07-15 audits filed |

## Pipeline Evidence

| Cycle | Result |
| --- | --- |
| 1 | C0–C2 execution and review; resulting PRs #65, #67, #68 |
| 2 | T1/T2/G1 execution; audit condition discovery and remediation route |
| 3 | F1 recovery implementation and PR #72 E2E validation; G3 PR #73 |
| 4 | F2 audit-condition closure and PR #74 E2E validation |

## Included Repository Artifacts

| Capability | Primary artifacts |
| --- | --- |
| Command Center | `src/modules/dashboard/`, Command Center IA decision and Weekly Review implementation |
| Business Twin | `src/modules/interview/`, `src/modules/dashboard/services/discussion-service.ts` |
| Signup recovery | `src/app/auth/callback/route.ts`, `src/app/setup-workspace/page.tsx`, `src/modules/tenant/services/tenant-provisioning-service.ts` |
| AI routing | `src/modules/member/services/onboarding-service.ts`, `src/modules/voice/services/voice-service.ts`, `src/modules/ai/router/` |
| Product evidence | `docs/nextshift-os-3/OS_3_7_BLUEPRINT.md`, G1/G2 reports, two pipeline audits |

## Release Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| C0–C2 / T1–T2 / G1–G3 / F1–F2 delivered | PASS | PR registry above; Blueprint marks all complete |
| Source validation | PASS | Both audits: local type-check, lint, boundaries, tests, build, i18n audit |
| PR #73 CI | PASS | Run `29348997611`, including E2E 8m15s |
| PR #74 CI | PASS | Run `29379080638`, including E2E 8m45s |
| Two audits recorded | PASS WITH CONDITION | Both 2026-07-15 audits; only C-3 remains |
| Production F1 / `user_signed_up` observation | POST-DEPLOY | Required C-3 runbook in Final Verification |
| Tag creation | NOT CREATED | [Tag Preparation](TAG_PREPARATION.md) |

## Exclusions

- No tag is created or pushed.
- No merge to `main` is performed.
- No deployment, environment, Prisma, package, or CI change is part of this package.
