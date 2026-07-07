# RP-004 Workspace Runtime

Version: 1.0

Status: Released

Last Updated: 2026-07-07

---

## Purpose

RP-004 establishes the Workspace Runtime layer for Runtime Platform v1.0.

The Workspace Runtime creates, validates, activates, suspends, closes, snapshots, and isolates runtime workspaces across kernel-managed execution boundaries.

---

## Functional Scope

Implemented:

- Workspace runtime creation
- Workspace identity assignment
- Workspace lifecycle state model
- Workspace activation
- Workspace suspension
- Workspace closure
- Workspace state snapshot creation
- Runtime workspace validation
- Workspace isolation through workspace-scoped runtime contexts
- Workspace-to-session identity isolation
- Runtime metadata support
- Forbidden metadata key protection
- Typed `RuntimeWorkspaceError`
- Public exports from package root
- Unit tests for workspace behavior

---

## Runtime Workspace Lifecycle States

```text
created
active
suspended
closed
```

Workspaces are immutable runtime records. Lifecycle operations return new workspace records rather than mutating the existing workspace.

---

## Public API

```ts
RuntimeWorkspace
RuntimeWorkspaceIdentity
RuntimeWorkspaceLifecycleState
RuntimeWorkspaceSnapshot
RuntimeWorkspaceError
RuntimeWorkspaceErrorCode
RuntimeWorkspaceErrorDetails
createRuntimeWorkspace
activateRuntimeWorkspace
suspendRuntimeWorkspace
closeRuntimeWorkspace
snapshotRuntimeWorkspace
isRuntimeWorkspace
```

Additional helpers:

```ts
RuntimeWorkspaceMetadata
RuntimeWorkspaceKind
CreateRuntimeWorkspaceInput
RuntimeWorkspaceTransitionInput
isRuntimeWorkspaceIdentity
isTerminalRuntimeWorkspaceLifecycleState
isRuntimeWorkspaceLifecycleState
```

---

## Package

```text
packages/runtime/src/workspace/
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
```

Both commands passed for RP-004.

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

Perform Git Release Checkpoint for RP-004, then continue to RP-005 Capability Runtime.
