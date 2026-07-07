# RP-007 Permission / Diagnostics Runtime Execution Task

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Task

Implement RP-007 Permission / Diagnostics Runtime for NextShift OS 3.3 Runtime Platform v1.0.

---

## Branch

Use the current OS 3.3 planning branch:

```text
planning/os-3.3-runtime-platform
```

---

## Implementation Steps

1. Inspect the existing RP-001 Runtime Kernel, RP-002 Context Runtime, RP-003 Session Runtime, RP-004 Workspace Runtime, RP-005 Capability Runtime, and RP-006 Event Runtime.
2. Add permission runtime source files under `packages/runtime/src/permission/`.
3. Add diagnostics runtime source files under `packages/runtime/src/diagnostics/`.
4. Export permission and diagnostics runtime APIs from `packages/runtime/src/index.ts`.
5. Add unit tests under `packages/runtime/test/runtime-permission.test.ts` and `packages/runtime/test/runtime-diagnostics.test.ts`.
6. Create RP-007 implementation documentation.
7. Update Runtime Platform navigation and `MASTER_INDEX.md`.
8. Run required validation.
9. Stop after RP-007 reporting.

---

## Required Tests

Add permission coverage for:

- Permission creation
- Permission identity assignment
- Permission decision validation
- Permission scope validation
- Permission snapshot immutability
- Permission metadata support
- Invalid permission failures
- Forbidden metadata key failures

Add diagnostics coverage for:

- Diagnostics creation
- Diagnostics identity assignment
- Diagnostics health validation
- Diagnostics status snapshot creation
- Diagnostics metadata support
- Runtime diagnostic event compatibility
- Invalid diagnostics failures
- Forbidden metadata key failures

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
2. Functional scope implemented
3. Tests executed
4. Typecheck result
5. Documentation created or updated
6. Known limitations
7. Git status summary
8. Whether commit or push was performed

---

## Stop Condition

Do not proceed to RP-008 Runtime Platform Integration / Release until the next lifecycle package is generated.
