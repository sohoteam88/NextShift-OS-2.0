# RP-004 Workspace Runtime Repository Audit Contract

Version: 1.0

Status: Ready for Audit

Last Updated: 2026-07-07

---

## Purpose

Define the repository audit scope for RP-004 Workspace Runtime.

The audit validates that the Workspace Runtime implementation is complete, scoped, tested, documented, and ready for release checkpoint consideration.

---

## Audit Scope

Review RP-004 files:

```text
packages/runtime/src/workspace/
packages/runtime/src/index.ts
packages/runtime/test/runtime-workspace.test.ts
docs/nextshift-os-3/runtime-platform/slices/RP-004-workspace-runtime/
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/MASTER_INDEX.md
```

Out of scope:

```text
docs/nextshift-os-3/context-package/
artifacts/
RP-005+
```

---

## Audit Checklist

### 1. File Completeness

Verify required implementation files exist:

- `runtime-workspace.ts`
- `runtime-workspace-lifecycle.ts`
- `runtime-workspace-error.ts`
- `workspace/index.ts`
- `runtime-workspace.test.ts`

### 2. Public API

Verify public exports include:

- `RuntimeWorkspace`
- `RuntimeWorkspaceIdentity`
- `RuntimeWorkspaceLifecycleState`
- `RuntimeWorkspaceSnapshot`
- `RuntimeWorkspaceError`
- `RuntimeWorkspaceErrorCode`
- `RuntimeWorkspaceErrorDetails`
- `createRuntimeWorkspace`
- `activateRuntimeWorkspace`
- `suspendRuntimeWorkspace`
- `closeRuntimeWorkspace`
- `snapshotRuntimeWorkspace`
- `isRuntimeWorkspace`

### 3. Functional Coverage

Verify implementation supports:

- Workspace runtime creation
- Workspace identity assignment
- Workspace lifecycle transitions
- Workspace activation
- Workspace suspension
- Workspace closure
- Workspace state snapshot creation
- Workspace validation
- Workspace-scoped context isolation
- Session workspace identity isolation
- Workspace metadata support
- Typed errors

### 4. Test Coverage

Verify tests cover:

- Workspace creation
- Workspace identity assignment
- Workspace-scoped runtime context binding
- Runtime session binding
- Non-workspace context isolation failures
- Session workspace identity mismatch failures
- Workspace lifecycle transitions
- Invalid lifecycle transitions
- Snapshot immutability
- Invalid identity failures
- Forbidden metadata key failures
- Invalid runtime workspace candidates

### 5. Scope Boundary

Verify RP-004 does not implement:

- RP-005 Capability Runtime
- RP-006 Event Runtime
- RP-007 Runtime Permission Boundary
- RP-008 Runtime Platform Consolidation
- UI behavior
- API routes
- Persistence
- Product-specific workspace state
- Authentication provider behavior

### 6. Documentation Quality

Verify:

- RP-004 planning documents exist.
- RP-004 README exists.
- RP-004 implementation report exists.
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

RP-004 may proceed to Stop C only if:

- Required implementation files exist.
- Validation passes.
- Scope boundary is preserved.
- Required documentation exists.
- No blocking audit findings remain.
