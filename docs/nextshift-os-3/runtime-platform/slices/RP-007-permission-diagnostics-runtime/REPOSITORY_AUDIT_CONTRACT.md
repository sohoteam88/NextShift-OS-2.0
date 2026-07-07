# RP-007 Permission / Diagnostics Runtime Repository Audit Contract

Version: 1.0

Status: Ready for Audit

Last Updated: 2026-07-07

---

## Purpose

Define the repository audit scope for RP-007 Permission / Diagnostics Runtime.

The audit validates that the Permission / Diagnostics Runtime implementation is complete, scoped, tested, documented, and ready for release checkpoint consideration.

---

## Audit Scope

Review RP-007 files:

```text
packages/runtime/src/permission/
packages/runtime/src/diagnostics/
packages/runtime/src/index.ts
packages/runtime/test/runtime-permission.test.ts
packages/runtime/test/runtime-diagnostics.test.ts
docs/nextshift-os-3/runtime-platform/slices/RP-007-permission-diagnostics-runtime/
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/MASTER_INDEX.md
```

Out of scope:

```text
docs/nextshift-os-3/context-package/
artifacts/
RP-008
```

---

## Audit Checklist

### 1. File Completeness

Verify required permission implementation files exist:

- `runtime-permission.ts`
- `runtime-permission-decision.ts`
- `runtime-permission-error.ts`
- `permission/index.ts`
- `runtime-permission.test.ts`

Verify required diagnostics implementation files exist:

- `runtime-diagnostics.ts`
- `runtime-diagnostics-status.ts`
- `runtime-diagnostics-error.ts`
- `diagnostics/index.ts`
- `runtime-diagnostics.test.ts`

### 2. Public API

Verify public permission exports include:

- `RuntimePermission`
- `RuntimePermissionIdentity`
- `RuntimePermissionDecision`
- `RuntimePermissionScope`
- `RuntimePermissionMetadata`
- `RuntimePermissionSnapshot`
- `RuntimePermissionError`
- `RuntimePermissionErrorCode`
- `RuntimePermissionErrorDetails`
- `CreateRuntimePermissionInput`
- `createRuntimePermission`
- `snapshotRuntimePermission`
- `isRuntimePermission`
- `isRuntimePermissionIdentity`
- `isRuntimePermissionDecision`
- `isRuntimePermissionScope`

Verify public diagnostics exports include:

- `RuntimeDiagnostics`
- `RuntimeDiagnosticsIdentity`
- `RuntimeDiagnosticsHealth`
- `RuntimeDiagnosticsStatus`
- `RuntimeDiagnosticsMetadata`
- `RuntimeDiagnosticsSnapshot`
- `RuntimeDiagnosticsError`
- `RuntimeDiagnosticsErrorCode`
- `RuntimeDiagnosticsErrorDetails`
- `CreateRuntimeDiagnosticsInput`
- `createRuntimeDiagnostics`
- `snapshotRuntimeDiagnostics`
- `isRuntimeDiagnostics`
- `isRuntimeDiagnosticsIdentity`
- `isRuntimeDiagnosticsHealth`
- `isRuntimeDiagnosticsStatus`

### 3. Functional Coverage

Verify implementation supports:

- Runtime permission boundary model
- Permission identity assignment
- Permission scope validation
- Permission decision validation
- Permission snapshot creation
- Permission metadata support
- Runtime diagnostics model
- Diagnostics health validation
- Diagnostics status validation
- Diagnostics snapshot creation
- Diagnostics metadata support
- Runtime diagnostic event compatibility
- Typed permission errors
- Typed diagnostics errors

### 4. Test Coverage

Verify permission tests cover:

- Permission creation
- Permission identity assignment
- Permission decision validation
- Permission scope validation
- Permission snapshot immutability
- Permission metadata support
- Invalid permission identity failures
- Invalid permission decision failures
- Forbidden metadata key failures
- Invalid runtime permission candidates

Verify diagnostics tests cover:

- Diagnostics creation
- Diagnostics identity assignment
- Diagnostics health validation
- Diagnostics status validation
- Diagnostics status snapshot creation
- Diagnostics metadata support
- Runtime diagnostic event compatibility
- Invalid diagnostics identity failures
- Invalid event compatibility failures
- Forbidden metadata key failures
- Invalid runtime diagnostics candidates

### 5. Scope Boundary

Verify RP-007 does not implement:

- RP-008 Runtime Platform Integration / Release
- Deployment Platform
- External observability providers
- External policy engines
- UI behavior
- API routes
- Persistence
- Business-specific permission policy

### 6. Documentation Quality

Verify:

- RP-007 planning documents exist.
- RP-007 README exists.
- RP-007 implementation report exists.
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

RP-007 may proceed to Stop C only if:

- Required implementation files exist.
- Validation passes.
- Scope boundary is preserved.
- Required documentation exists.
- No blocking audit findings remain.
