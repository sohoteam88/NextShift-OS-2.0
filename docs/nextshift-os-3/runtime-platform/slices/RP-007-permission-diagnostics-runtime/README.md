# RP-007 Permission / Diagnostics Runtime

Version: 1.0

Status: Released

Last Updated: 2026-07-07

---

## Purpose

RP-007 establishes the Permission / Diagnostics Runtime layer for Runtime Platform v1.0.

The Permission / Diagnostics Runtime creates, validates, snapshots, and exports permission decisions and runtime diagnostics health/status records.

---

## Functional Scope

Implemented:

- Runtime permission boundary model
- Permission identity model
- Permission decision model
- Permission validation
- Permission snapshot creation
- Runtime diagnostics model
- Diagnostics health model
- Diagnostics status snapshot creation
- Diagnostics validation
- Runtime diagnostic event compatibility with RP-006 events
- Forbidden metadata key protection
- Typed `RuntimePermissionError`
- Typed `RuntimeDiagnosticsError`
- Public exports from package root
- Unit tests for permission and diagnostics behavior

---

## Permission Decisions

```text
allow
deny
abstain
```

Permission records are immutable runtime facts. RP-007 models permission decisions but does not implement business-specific policy evaluation.

---

## Diagnostics Health / Status

Health:

```text
healthy
degraded
unhealthy
```

Status:

```text
ok
warning
critical
```

Diagnostics records are immutable runtime observations. They can reference compatible RP-006 runtime events without implementing event dispatch.

---

## Public API

Permission:

```ts
RuntimePermission
RuntimePermissionIdentity
RuntimePermissionDecision
RuntimePermissionScope
RuntimePermissionMetadata
RuntimePermissionSnapshot
RuntimePermissionError
RuntimePermissionErrorCode
RuntimePermissionErrorDetails
CreateRuntimePermissionInput
createRuntimePermission
snapshotRuntimePermission
isRuntimePermission
isRuntimePermissionIdentity
isRuntimePermissionDecision
isRuntimePermissionScope
```

Diagnostics:

```ts
RuntimeDiagnostics
RuntimeDiagnosticsIdentity
RuntimeDiagnosticsHealth
RuntimeDiagnosticsStatus
RuntimeDiagnosticsMetadata
RuntimeDiagnosticsSnapshot
RuntimeDiagnosticsError
RuntimeDiagnosticsErrorCode
RuntimeDiagnosticsErrorDetails
CreateRuntimeDiagnosticsInput
createRuntimeDiagnostics
snapshotRuntimeDiagnostics
isRuntimeDiagnostics
isRuntimeDiagnosticsIdentity
isRuntimeDiagnosticsHealth
isRuntimeDiagnosticsStatus
```

---

## Package

```text
packages/runtime/src/permission/
packages/runtime/src/diagnostics/
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

All commands passed for RP-007.

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

Perform Git Release Checkpoint for RP-007, then continue to RP-008 Runtime Platform Consolidation.
