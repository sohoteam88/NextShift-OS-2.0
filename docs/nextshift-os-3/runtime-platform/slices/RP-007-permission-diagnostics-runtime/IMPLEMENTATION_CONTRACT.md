# RP-007 Permission / Diagnostics Runtime Implementation Contract

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Objective

Implement the Permission / Diagnostics Runtime slice for Runtime Platform v1.0.

RP-007 must extend `@nextshift/runtime` with runtime permission and diagnostics contracts that can be used by RP-008 Runtime Platform Integration / Release.

---

## Required Implementation Scope

Create or update:

```text
packages/runtime/src/permission/runtime-permission.ts
packages/runtime/src/permission/runtime-permission-error.ts
packages/runtime/src/permission/index.ts
packages/runtime/src/diagnostics/runtime-diagnostics.ts
packages/runtime/src/diagnostics/runtime-diagnostics-error.ts
packages/runtime/src/diagnostics/index.ts
packages/runtime/src/index.ts
packages/runtime/test/runtime-permission.test.ts
packages/runtime/test/runtime-diagnostics.test.ts
```

Update documentation:

```text
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/runtime-platform/slices/RP-007-permission-diagnostics-runtime/README.md
docs/nextshift-os-3/runtime-platform/slices/RP-007-permission-diagnostics-runtime/IMPLEMENTATION_REPORT.md
docs/nextshift-os-3/MASTER_INDEX.md
```

---

## Functional Requirements

The implementation must support:

1. Runtime permission boundary model
2. Permission identity model
3. Permission decision model
4. Permission validation
5. Permission snapshot creation
6. Runtime diagnostics model
7. Diagnostics health model
8. Diagnostics status snapshot creation
9. Diagnostics validation
10. Runtime diagnostic event compatibility
11. Typed runtime permission errors
12. Typed runtime diagnostics errors
13. Public exports from package root
14. Unit tests for permission and diagnostics behavior

---

## Suggested Permission API

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
```

---

## Suggested Diagnostics API

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
```

---

## Boundary Rules

The Permission / Diagnostics Runtime must not:

- Store secrets.
- Depend on product-specific domain models.
- Depend on browser or UI APIs.
- Persist permission or diagnostics records externally.
- Implement external policy engines.
- Implement external observability provider integrations.
- Implement API routes.
- Implement deployment platform behavior.
- Implement RP-008 integration or release behavior.
- Mutate runtime contexts owned by RP-002.
- Mutate runtime sessions owned by RP-003.
- Mutate runtime workspaces owned by RP-004.
- Mutate runtime capabilities owned by RP-005.
- Mutate runtime events owned by RP-006.

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

RP-007 is complete when:

- Permission Runtime source files exist under `packages/runtime/src/permission/`.
- Diagnostics Runtime source files exist under `packages/runtime/src/diagnostics/`.
- Permission and diagnostics tests pass.
- Package-level and root typecheck pass.
- RP-007 documentation exists and is linked.
- No RP-008 behavior is implemented.
- No generated artifact ZIP is committed.
