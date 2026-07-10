# RP-005 Capability Runtime Execution Task

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Task

Implement RP-005 Capability Runtime for NextShift OS 3.3 Runtime Platform v1.0.

---

## Branch

Use the current OS 3.3 planning branch:

```text
planning/os-3.3-runtime-platform
```

---

## Implementation Steps

1. Inspect the existing RP-001 Runtime Kernel, RP-002 Context Runtime, RP-003 Session Runtime, and RP-004 Workspace Runtime.
2. Add capability runtime source files under `packages/runtime/src/capability/`.
3. Export capability runtime API from `packages/runtime/src/index.ts`.
4. Add unit tests under `packages/runtime/test/runtime-capability.test.ts`.
5. Create RP-005 implementation documentation.
6. Update Runtime Platform navigation and `MASTER_INDEX.md`.
7. Run required validation.
8. Stop after RP-005 reporting.

---

## Required Tests

Add coverage for:

- Capability creation
- Capability identity assignment
- Capability lifecycle transitions
- Capability snapshot immutability
- Capability validation
- Invalid capability failures
- Capability isolation failures
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

Do not proceed to RP-006 Event Runtime until the next lifecycle package is generated.
