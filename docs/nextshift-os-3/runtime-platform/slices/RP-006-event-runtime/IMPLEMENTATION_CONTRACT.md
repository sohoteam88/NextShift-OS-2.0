# RP-006 Event Runtime Implementation Contract

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Objective

Implement the Event Runtime slice for Runtime Platform v1.0.

RP-006 must extend `@nextshift/runtime` with runtime event contracts and helpers that can be used by later permission, diagnostics, audit, and dispatch runtime slices.

---

## Required Implementation Scope

Create or update:

```text
packages/runtime/src/event/runtime-event.ts
packages/runtime/src/event/runtime-event-error.ts
packages/runtime/src/event/index.ts
packages/runtime/src/index.ts
packages/runtime/test/runtime-event.test.ts
```

Update documentation:

```text
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/runtime-platform/slices/RP-006-event-runtime/README.md
docs/nextshift-os-3/runtime-platform/slices/RP-006-event-runtime/IMPLEMENTATION_REPORT.md
docs/nextshift-os-3/MASTER_INDEX.md
```

---

## Functional Requirements

The implementation must support:

1. Runtime event creation
2. Runtime event identity
3. Runtime event type model
4. Runtime event payload model
5. Runtime event metadata
6. Runtime event timestamping
7. Runtime event snapshot creation
8. Runtime event validation
9. Runtime event scope isolation
10. Typed runtime event errors
11. Public exports from package root
12. Unit tests for event behavior

---

## Suggested Public API

```ts
RuntimeEvent
RuntimeEventIdentity
RuntimeEventType
RuntimeEventPayload
RuntimeEventMetadata
RuntimeEventSnapshot
RuntimeEventError
RuntimeEventErrorCode
RuntimeEventErrorDetails
CreateRuntimeEventInput
createRuntimeEvent
snapshotRuntimeEvent
isRuntimeEvent
isRuntimeEventIdentity
```

---

## Boundary Rules

The Event Runtime must not:

- Store secrets.
- Depend on product-specific domain models.
- Depend on browser or UI APIs.
- Persist events externally.
- Implement event bus dispatch.
- Implement external event transport.
- Implement queue infrastructure.
- Implement permission or diagnostics behavior.
- Mutate runtime contexts owned by RP-002.
- Mutate runtime sessions owned by RP-003.
- Mutate runtime workspaces owned by RP-004.
- Mutate runtime capabilities owned by RP-005.

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

RP-006 is complete when:

- Event Runtime source files exist under `packages/runtime/src/event/`.
- Event Runtime tests pass.
- Package-level and root typecheck pass.
- RP-006 documentation exists and is linked.
- No RP-007 or later slice behavior is implemented.
- No generated artifact ZIP is committed.
