# OS 3.3 Runtime Platform Release Candidate

Version: 3.3 RC1

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-10

---

## Purpose

This release candidate package records the OS 3.3 Runtime Platform delivery completed across PR #16 through PR #21.

It consolidates the runtime adapter callsites, adapter factory, Runtime Adapter Standard v1.0 factory hardening, CI gates, flag governance, security hardening, module-boundary baseline, and legacy runtime package boundary declarations into one approval-ready package.

This package does not approve production release, create a tag, or freeze OS 3.3. Those decisions remain separate Steven approval gates.

---

## Release Package

- [Release Notes](RELEASE_NOTES.md)
- [Release Manifest](RELEASE_MANIFEST.md)
- [Final Verification](FINAL_VERIFICATION.md)
- [Tag Preparation](TAG_PREPARATION.md)

---

## Release Scope

Included PR scope:

- PR #16 - Revenue and Analytics runtime adapter callsites
- PR #17 - CI branch trigger coverage for planning and release branches
- PR #18 - CI E2E environment guard and setup documentation
- PR #19 - `createRuntimeAdapter()` factory and pilot adapter refactor
- PR #20 - Legacy runtime package boundary declarations
- PR #21 - Runtime flag registry, image allowlist hardening, public endpoint rate limits, ESLint module-boundary baseline, and Layer roadmap file placement

Included runtime capabilities:

- Revenue Runtime Adapter connected to a real service/API path
- Analytics Runtime Adapter connected to a real service path
- `@nextshift/runtime` adapter factory as the required adapter lifecycle implementation
- Runtime Adapter Standard v1.0 updated to require the factory and safe warning payload enumeration
- Feature flags registered centrally:
  - `retiredRevenueRuntimeFlag`
  - `retiredAnalyticsRuntimeFlag`

Included platform hardening:

- CI gates expanded for planning/release PRs
- Package tests run in CI
- E2E job safely skipped when required secrets are missing
- Image `remotePatterns` narrowed from wildcards to approved domains
- Public slug and invite endpoints rate-limited
- ESLint module-boundary rule introduced at warn level with a 192-warning baseline
- Legacy runtime package boundaries documented so future adapters use `@nextshift/runtime`

Excluded:

- Production deployment
- Production release approval
- Release tag creation
- Runtime Platform freeze decision
- New Pilot 3 adapter work
- Prisma, environment, deployment, or source implementation changes beyond the already merged PR #16-#21 scope

---

## Release Decision

Current decision:

```text
OS 3.3 RC package prepared, awaiting approval
```

Recommended tag is prepared in the tag preparation document, but no tag has been created.

---

## Audit Evidence

- [Architecture Review with Round 1 and Round 2 Audit Results](../../reviews/ARCHITECTURE_REVIEW_2026-07-09.md)
- [Round 1 Code Review Report - PR #16-#19](../../../../audit/OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md)
- [Round 2 Code Review Report - PR #20-#21](../../../../audit/OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md)

Both audit rounds concluded PASS with no blocking findings.
