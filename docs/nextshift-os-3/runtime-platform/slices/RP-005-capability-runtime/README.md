# RP-005 Capability Runtime

Version: 1.0

Status: Released

Last Updated: 2026-07-07

---

## Purpose

RP-005 establishes the Capability Runtime layer for Runtime Platform v1.0.

The Capability Runtime creates, validates, activates, suspends, retires, snapshots, and isolates runtime capabilities across context, workspace, and session boundaries.

---

## Functional Scope

Implemented:

- Capability runtime creation
- Capability identity assignment
- Capability lifecycle state model
- Capability activation
- Capability suspension
- Capability retirement
- Capability state snapshot creation
- Runtime capability validation
- Capability isolation through capability-scoped runtime contexts
- Capability-to-workspace identity isolation
- Capability-to-session identity isolation
- Runtime metadata support
- Forbidden metadata key protection
- Typed `RuntimeCapabilityError`
- Public exports from package root
- Unit tests for capability behavior

---

## Runtime Capability Lifecycle States

```text
registered
active
suspended
retired
```

Capabilities are immutable runtime records. Lifecycle operations return new capability records rather than mutating the existing capability.

---

## Public API

```ts
RuntimeCapability
RuntimeCapabilityIdentity
RuntimeCapabilityLifecycleState
RuntimeCapabilitySnapshot
RuntimeCapabilityError
RuntimeCapabilityErrorCode
RuntimeCapabilityErrorDetails
createRuntimeCapability
activateRuntimeCapability
suspendRuntimeCapability
retireRuntimeCapability
snapshotRuntimeCapability
isRuntimeCapability
```

Additional helpers:

```ts
RuntimeCapabilityMetadata
RuntimeCapabilityKind
CreateRuntimeCapabilityInput
RuntimeCapabilityTransitionInput
isRuntimeCapabilityIdentity
isTerminalRuntimeCapabilityLifecycleState
isRuntimeCapabilityLifecycleState
```

---

## Package

```text
packages/runtime/src/capability/
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

All commands passed for RP-005.

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

Perform Git Release Checkpoint for RP-005, then continue to RP-006 Event Runtime.
