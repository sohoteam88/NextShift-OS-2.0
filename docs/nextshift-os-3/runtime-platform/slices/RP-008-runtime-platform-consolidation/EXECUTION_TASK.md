# RP-008 Runtime Platform Consolidation Execution Task

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Task

Implement RP-008 Runtime Platform Consolidation for NextShift OS 3.3 Runtime Platform v1.0.

---

## Branch

Use the current OS 3.3 planning branch:

```text
planning/os-3.3-runtime-platform
```

---

## Implementation Steps

1. Inspect RP-001 through RP-007 runtime source, tests, documentation, verification, audit, and release records.
2. Review `packages/runtime/src/index.ts` and package root exports for consistency.
3. Review runtime package module boundaries across kernel, context, session, workspace, capability, event, permission, and diagnostics.
4. Validate cross-runtime compatibility between completed runtime slices.
5. Review runtime tests for package-level coverage consistency.
6. Create RP-008 consolidation documentation.
7. Update Runtime Platform navigation and `MASTER_INDEX.md` if required.
8. Prepare Runtime Platform v1.0 release readiness evidence.
9. Run required validation.
10. Stop after RP-008 implementation reporting.

---

## Required Review Coverage

Review and report on:

- Runtime package integration
- Public API exports
- Runtime package consistency
- Cross-runtime compatibility
- Runtime documentation completeness
- Runtime release package preparation
- Runtime Platform v1.0 release readiness

---

## Required Commands

Run:

```bash
pnpm --filter @nextshift/runtime test
pnpm --filter @nextshift/runtime typecheck
pnpm type-check
git diff --check
git diff --cached --check
```

---

## Return Format

Return:

1. Files changed
2. Consolidation scope implemented
3. Tests executed
4. Typecheck result
5. Documentation created or updated
6. Known limitations
7. Git status summary
8. Whether commit or push was performed

---

## Stop Condition

Do not proceed to Runtime Platform v1.0 release package generation until the next lifecycle package is generated.
