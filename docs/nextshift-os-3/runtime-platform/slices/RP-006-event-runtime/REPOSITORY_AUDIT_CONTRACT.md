# RP-006 Event Runtime Repository Audit Contract

Version: 1.0

Status: Ready for Audit

Last Updated: 2026-07-07

---

## Purpose

Define the repository audit scope for RP-006 Event Runtime.

The audit validates that the Event Runtime implementation is complete, scoped, tested, documented, and ready for release checkpoint consideration.

---

## Audit Scope

Review RP-006 files:

```text
packages/runtime/src/event/
packages/runtime/src/index.ts
packages/runtime/test/runtime-event.test.ts
docs/nextshift-os-3/runtime-platform/slices/RP-006-event-runtime/
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/MASTER_INDEX.md
```

Out of scope:

```text
docs/nextshift-os-3/context-package/
artifacts/
RP-007+
```

---

## Audit Checklist

### 1. File Completeness

Verify required implementation files exist:

- `runtime-event.ts`
- `runtime-event-type.ts`
- `runtime-event-error.ts`
- `event/index.ts`
- `runtime-event.test.ts`

### 2. Public API

Verify public exports include:

- `RuntimeEvent`
- `RuntimeEventIdentity`
- `RuntimeEventType`
- `RuntimeEventPayload`
- `RuntimeEventMetadata`
- `RuntimeEventSnapshot`
- `RuntimeEventError`
- `RuntimeEventErrorCode`
- `RuntimeEventErrorDetails`
- `CreateRuntimeEventInput`
- `createRuntimeEvent`
- `snapshotRuntimeEvent`
- `isRuntimeEvent`
- `isRuntimeEventIdentity`
- `isRuntimeEventType`

### 3. Functional Coverage

Verify implementation supports:

- Runtime event creation
- Event identity assignment
- Event type validation
- Event payload support
- Event metadata support
- Event timestamping
- Event state snapshot creation
- Event validation
- Event-scoped context isolation
- Workspace identity isolation
- Session workspace identity isolation
- Capability identity isolation
- Forbidden payload key protection
- Forbidden metadata key protection
- Typed errors

### 4. Test Coverage

Verify tests cover:

- Event creation
- Event identity assignment
- Event type validation
- Event-scoped runtime context binding
- Runtime workspace binding
- Runtime session binding
- Runtime capability binding
- Non-event context isolation failures
- Workspace identity mismatch failures
- Session workspace identity mismatch failures
- Capability identity mismatch failures
- Snapshot immutability
- Invalid identity failures
- Forbidden payload key failures
- Forbidden metadata key failures
- Invalid runtime event candidates

### 5. Scope Boundary

Verify RP-006 does not implement:

- RP-007 Runtime Permission Boundary
- RP-008 Runtime Platform Consolidation
- UI behavior
- API routes
- Persistence
- Event bus integration
- External transport
- Queue infrastructure
- Product-specific event behavior

### 6. Documentation Quality

Verify:

- RP-006 planning documents exist.
- RP-006 README exists.
- RP-006 implementation report exists.
- Requirements verification exists.
- MASTER_INDEX links resolve.
- No generated artifact ZIP is tracked.

---

## Validation Commands

Run:

```bash
pnpm --filter @nextshift/runtime test
pnpm --filter @nextshift/runtime typecheck
pnpm type-check
git diff --check
git diff --cached --check
```

Run Markdown link validation if a repository-standard command exists.

---

## Audit Output

Produce:

- Audit result
- Files reviewed
- Functional coverage
- Test coverage
- Scope compliance
- Documentation quality
- Validation results
- Findings
- Required corrections
- Release recommendation

---

## Release Gate

RP-006 may proceed to Stop C only if:

- Required implementation files exist.
- Validation passes.
- Scope boundary is preserved.
- Required documentation exists.
- No blocking audit findings remain.
