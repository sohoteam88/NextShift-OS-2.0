# RP-006 Event Runtime

Version: 1.0

Status: Released

Last Updated: 2026-07-07

---

## Purpose

RP-006 establishes the Event Runtime layer for Runtime Platform v1.0.

The Event Runtime creates, validates, timestamps, snapshots, and isolates runtime events across context, workspace, session, and capability boundaries.

---

## Functional Scope

Implemented:

- Runtime event creation
- Runtime event identity assignment
- Runtime event type model
- Runtime event payload model
- Runtime event metadata support
- Runtime event timestamping
- Runtime event snapshot creation
- Runtime event validation
- Event isolation through event-scoped runtime contexts
- Event-to-workspace identity isolation
- Event-to-session identity isolation
- Event-to-capability identity isolation
- Forbidden payload and metadata key protection
- Typed `RuntimeEventError`
- Public exports from package root
- Unit tests for event behavior

---

## Runtime Event Type Model

Runtime event types are lowercase dot- or hyphen-delimited strings.

Examples:

```text
runtime.event-created
capability.registered
workspace.updated
```

---

## Public API

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
isRuntimeEventType
```

---

## Package

```text
packages/runtime/src/event/
```

Public package:

```text
@nextshift/runtime
```

---

## Validation

```bash
pnpm --filter @nextshift/runtime test
pnpm --filter @nextshift/runtime typecheck
pnpm type-check
git diff --check
git diff --cached --check
```

All commands passed for RP-006.

---

## Documentation Set

- [Project Planning](PROJECT_PLANNING.md)
- [Implementation Contract](IMPLEMENTATION_CONTRACT.md)
- [Execution Task](EXECUTION_TASK.md)
- [Implementation Report](IMPLEMENTATION_REPORT.md)
- [Requirements Verification](REQUIREMENTS_VERIFICATION.md)
- [Repository Audit Contract](REPOSITORY_AUDIT_CONTRACT.md)
- [Release Notes](RELEASE_NOTES.md)
- [Release Checklist](RELEASE_CHECKLIST.md)
- [Approval Record](APPROVAL_RECORD.md)
- [Release Summary](RELEASE_SUMMARY.md)

---

## Next Step

Perform Git Release Checkpoint for RP-006, then continue to RP-007 Runtime Permission Boundary.
