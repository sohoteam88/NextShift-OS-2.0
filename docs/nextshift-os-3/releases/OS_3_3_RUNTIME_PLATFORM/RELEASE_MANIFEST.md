# OS 3.3 Runtime Platform Release Manifest

Version: 3.3 RC1

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-10

---

## Release Identity

| Field | Value |
| --- | --- |
| Release Name | OS 3.3 Runtime Platform |
| Release Version | 3.3 RC1 |
| Release Package | `docs/nextshift-os-3/releases/OS_3_3_RUNTIME_PLATFORM/` |
| Source Branch | `planning/os-3.3-runtime-platform` |
| Package Branch | `release/os-3.3-rc-package` |
| Release State | RC package prepared, awaiting approval |
| Tag Status | Prepared, not created |
| Recommended Tag | `v3.3.0-rc1` |

---

## Documentation Set

| Artifact | Purpose |
| --- | --- |
| [README](README.md) | Release package entry point |
| [Release Notes](RELEASE_NOTES.md) | User-facing release summary and known limitations |
| [Release Manifest](RELEASE_MANIFEST.md) | PR-by-PR scope and artifact registry |
| [Final Verification](FINAL_VERIFICATION.md) | Verification evidence and audit references |
| [Tag Preparation](TAG_PREPARATION.md) | Release candidate tag plan |

---

## Included PRs And Commits

| PR | Merge Commit | Delivery Commit | Scope | Primary Deliverables |
| --- | --- | --- | --- | --- |
| #16 | `f888336` | `6c4a965` | Runtime adapter callsites | Revenue and Analytics adapters connected to real service/API paths; flag-off legacy behavior preserved; callsite tests added |
| #17 | `d3e203b` | `fedd8a7` | CI branch triggers | CI runs on planning and release PRs; packages tests added to CI |
| #18 | `34716dc` | `5ad2665` | CI E2E guard | E2E secret detection added; E2E skips safely when secrets are absent; setup docs added |
| #19 | `1168dc3` | `e323759` | Adapter factory | `createRuntimeAdapter()` added to `@nextshift/runtime`; Revenue and Analytics adapters refactored to factory; Runtime Adapter Standard updated |
| #20 | `c643953` | `9552830` | Legacy runtime package boundaries | `runtime-core`, `runtime-adapters`, `runtime-orchestrator`, and `workspace-runtime` retained with README boundary declarations |
| #21 | `888b04e` | `1195127` | Hardening cleanup | Runtime flag registry, image allowlist hardening, rate limits, ESLint module boundary baseline, Layer roadmap placement |

Audit record commit:

| Commit | Scope |
| --- | --- |
| `25f06fb` | Round 1 code review result for PR #16-#19 |
| `feed960` | Round 2 code review result for PR #20-#21 |

---

## Included Repository Artifacts

### Runtime Adapter Standard And Runtime Platform

- [Runtime Adapter Standard](../../runtime-standard/RUNTIME_ADAPTER_STANDARD.md)
- [Runtime Standard README](../../runtime-standard/README.md)
- [Runtime Platform v1.0](../../runtime-platform/README.md)
- [Runtime Platform Architecture](../../runtime-platform/RUNTIME_PLATFORM_ARCHITECTURE.md)
- [Runtime Platform Reference Implementations](../../runtime-platform/REFERENCE_IMPLEMENTATIONS.md)

### Pilot Adapters

- Revenue Runtime Adapter source: `src/modules/revenue-drivers/runtime/`
- Revenue callsite service: `src/modules/revenue-drivers/services/revenue-driver-intent-service.ts`
- Analytics Runtime Adapter source: `src/modules/analytics/runtime/`
- Analytics callsite service: `src/modules/analytics/analyticsService.ts`

### Adapter Factory

- Factory source: `packages/runtime/src/adapter/create-runtime-adapter.ts`
- Factory tests: `packages/runtime/test/runtime-adapter-factory.test.ts`

### CI And Testing

- CI workflow: `.github/workflows/ci.yml`
- E2E setup documentation: `docs/E2E_CI_SETUP.md`

### Hardening And Governance

- Runtime flags registry: `src/lib/runtime-flags.ts`
- ESLint module boundary baseline: `.eslintrc.json`
- Layer roadmap: [Layer Roadmap P0](../../LAYER_ROADMAP_P0.md)
- Legacy runtime package boundary READMEs:
  - `packages/runtime-core/README.md`
  - `packages/runtime-adapters/README.md`
  - `packages/runtime-orchestrator/README.md`
  - `packages/workspace-runtime/README.md`

### Audit Evidence

- [Architecture Review with Audit Results](../../reviews/ARCHITECTURE_REVIEW_2026-07-09.md)
- [Round 1 Code Review Report](../../../../audit/OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md)
- [Round 2 Code Review Report](../../../../audit/OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md)

---

## Release Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Revenue adapter callsite connected | PASS | PR #16, Round 1 audit |
| Analytics adapter callsite connected | PASS | PR #16, Round 1 audit |
| Adapter factory created and adopted by pilots | PASS | PR #19, Round 1 audit |
| Runtime Adapter Standard updated for factory usage | PASS | PR #19 and PR #20, Round 1 and Round 2 audits |
| CI planning/release branch coverage | PASS | PR #17 |
| CI package tests | PASS | PR #17 |
| CI E2E skip guard | PASS | PR #18 |
| Runtime flag registry | PASS | PR #21, Round 2 audit |
| Image allowlist hardening | PASS | PR #21, Round 2 audit |
| Public endpoint rate limiting | PASS with deployment advisory D-001 | PR #21, Round 2 audit |
| ESLint module-boundary baseline | PASS with 192 warn baseline | PR #21, Round 2 audit |
| Legacy package boundary declarations | PASS | PR #20, Round 2 audit |
| Release tag prepared | PASS, not created | [Tag Preparation](TAG_PREPARATION.md) |
| Production approval | NOT GRANTED | This package is approval-ready only |
| Freeze decision | NOT GRANTED | Steven approval required |

---

## Exclusions

- No tag created
- No production release approved
- No Runtime Platform freeze marked
- No production deployment executed
- No Prisma changes
- No environment changes
- No new runtime adapter beyond Revenue and Analytics
