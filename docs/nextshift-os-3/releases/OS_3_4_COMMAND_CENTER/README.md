# OS 3.4 Command Center Release Candidate

Version: 3.4 RC

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-11

---

## Purpose

This release candidate package records the OS 3.4 Command Center delivery theme:

```text
Business Brain Becomes Visible
```

OS 3.4 moves the Runtime Platform from hidden infrastructure into visible operator value. It brings the Today's Recommendation card to the dashboard, connects the Command Center recommendation data path, expands runtime adapter coverage to five modules, graduates Revenue and Analytics runtime flags to default ON, and closes the Round 4 fallback observability condition through Sentry-visible runtime fallback warnings.

This package prepares the release for approval. It does not create a tag, merge to `main`, deploy production, or approve release by itself.

---

## Release Package

- [Release Notes](RELEASE_NOTES.md)
- [Release Manifest](RELEASE_MANIFEST.md)
- [Final Verification](FINAL_VERIFICATION.md)
- [Tag Preparation](TAG_PREPARATION.md)

---

## Release Scope

Primary Command Center scope:

- PR #32 - Today's Recommendation dashboard card
- PR #33 - CRM Runtime Adapter
- PR #34 - Command Center E2E chain and Revenue/Analytics flag graduation
- PR #35 - Runtime fallback warnings sent to Sentry

Included foundation scope from the OS 3.4 workstream:

- PR #23 - Governance slimdown and repository cleanup
- PR #24 - E2E CI login flow and admin-command guard
- PR #25 - Remaining admin page guards
- PR #26 - Mission Engine Runtime Adapter
- PR #27 - Deploy pipeline hardening
- PR #28 - OS 3.3 Runtime Platform production release
- PR #29 - v3.3.0 post-release status closeout
- PR #30 - Business State Runtime Adapter
- PR #31 - Command Center recommendation data path

---

## Release Capabilities

### Visible Business Brain

The dashboard can now show a Today's Recommendation card when:

```text
NEXT_PUBLIC_ENABLE_COMMAND_CENTER=true
```

The card displays the recommendation title, summary, confidence, source label, expandable rationale, and a CTA route.

### Runtime Adapter Coverage

OS 3.4 brings runtime adapter coverage to 5 of 68 modules:

- Revenue
- Analytics
- Mission Engine
- Business State
- CRM

All adapters follow the Runtime Adapter Standard and `createRuntimeAdapter()` factory pattern.

### Runtime Flag Graduation

Revenue and Analytics runtime adapters are graduated to default ON.

Explicit escape hatch behavior remains:

```text
retiredRevenueRuntimeFlag=false
retiredAnalyticsRuntimeFlag=false
```

Mission, Business State, CRM, and Command Center remain default OFF until later graduation.

### Production Observability

PR #35 closes the Round 4 R-1 condition by injecting a Sentry-aware runtime fallback logger into production adapter callsites. Adapter fallback warnings continue to use `console.warn` and are also captured by Sentry as warning-level messages with the safe payload provided by each adapter.

---

## Release Decision

Current decision:

```text
OS 3.4 RC prepared, awaiting approval
```

Recommended final tag:

```text
v3.4.0
```

The tag is prepared but not created.

---

## Audit Evidence

- [Round 3 Code Review Report - PR #23-#31](../../../../audit/OS34_R3_PR23_PR31_CODE_REVIEW_REPORT.md)
- [Round 4 Code Review Report - PR #32-#34](../../../../audit/OS34_R4_PR32_PR34_CODE_REVIEW_REPORT.md)
- [Architecture Review](../../reviews/ARCHITECTURE_REVIEW_2026-07-09.md)

Round 3 concluded PASS with non-blocking advisories. Round 4 concluded PASS WITH CONDITION; the blocking R-1 fallback observability condition is closed by PR #35.
