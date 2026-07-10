# RP-002 Context Runtime Execution Task

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Task

Implement RP-002 Context Runtime for NextShift OS 3.3 Runtime Platform v1.0.

---

## Branch

Use the current OS 3.3 planning branch:

```text
planning/os-3.3-runtime-platform
```

---

## Implementation Steps

1. Inspect the existing RP-001 runtime package.
2. Add context runtime source files under `packages/runtime/src/context/`.
3. Export context runtime API from `packages/runtime/src/index.ts`.
4. Add unit tests under `packages/runtime/test/runtime-context.test.ts`.
5. Create RP-002 implementation documentation.
6. Update Runtime Platform navigation and `MASTER_INDEX.md`.
7. Run required validation.
8. Stop after RP-002 reporting.

---

## Required Tests

Add coverage for:

- Context creation
- Scope assignment
- Parent-child derivation
- Correlation preservation
- Snapshot immutability
- Context validation
- Invalid context failures
- Scope isolation failures

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

Do not proceed to RP-003 Session Runtime until the next lifecycle package is generated.
