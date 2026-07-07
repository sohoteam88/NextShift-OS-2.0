# RP-002 Context Runtime Implementation Contract

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Objective

Implement the Context Runtime slice for Runtime Platform v1.0.

RP-002 must extend `@nextshift/runtime` with runtime context contracts and helpers that can be used by later session, workspace, capability, event, and permission runtime slices.

---

## Required Implementation Scope

Create or update:

```text
packages/runtime/src/context/runtime-context.ts
packages/runtime/src/context/runtime-context-scope.ts
packages/runtime/src/context/runtime-context-error.ts
packages/runtime/src/context/index.ts
packages/runtime/src/index.ts
packages/runtime/test/runtime-context.test.ts
```

Update documentation:

```text
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/runtime-platform/slices/RP-002-context-runtime/README.md
docs/nextshift-os-3/runtime-platform/slices/RP-002-context-runtime/IMPLEMENTATION_REPORT.md
docs/nextshift-os-3/MASTER_INDEX.md
```

---

## Functional Requirements

The implementation must support:

1. Runtime context creation
2. Runtime context scope assignment
3. Parent-child context propagation
4. Context snapshot creation
5. Context validation
6. Context isolation protection
7. Context metadata support
8. Correlation ID preservation
9. Typed runtime context errors
10. Public exports from package root
11. Unit tests for context behavior

---

## Suggested Public API

```ts
RuntimeContext
RuntimeContextScope
RuntimeContextSnapshot
RuntimeContextError
createRuntimeContext
deriveRuntimeContext
snapshotRuntimeContext
isRuntimeContext
```

---

## Boundary Rules

The Context Runtime must not:

- Store secrets.
- Depend on product-specific domain models.
- Depend on browser or UI APIs.
- Persist context externally.
- Implement session, workspace, capability, event, or permission behavior.

---

## Validation Requirements

Run and report:

```bash
pnpm --filter @nextshift/runtime test
pnpm --filter @nextshift/runtime typecheck
pnpm type-check
git diff --check
git diff --cached --check
```

Run Markdown link validation if a repository-standard command exists.

---

## Acceptance Criteria

RP-002 is complete when:

- Context Runtime source files exist under `packages/runtime/src/context/`.
- Context Runtime tests pass.
- Package-level and root typecheck pass.
- RP-002 documentation exists and is linked.
- No RP-003 or later slice behavior is implemented.
- No generated artifact ZIP is committed.
