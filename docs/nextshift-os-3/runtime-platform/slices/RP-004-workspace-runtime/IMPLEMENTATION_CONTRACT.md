# RP-004 Workspace Runtime Implementation Contract

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-07

---

## Objective

Implement the Workspace Runtime slice for Runtime Platform v1.0.

RP-004 must extend `@nextshift/runtime` with runtime workspace contracts and helpers that can be used by later capability, event, permission, and diagnostics runtime slices.

---

## Required Implementation Scope

Create or update:

```text
packages/runtime/src/workspace/runtime-workspace.ts
packages/runtime/src/workspace/runtime-workspace-lifecycle.ts
packages/runtime/src/workspace/runtime-workspace-error.ts
packages/runtime/src/workspace/index.ts
packages/runtime/src/index.ts
packages/runtime/test/runtime-workspace.test.ts
```

Update documentation:

```text
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/runtime-platform/slices/RP-004-workspace-runtime/README.md
docs/nextshift-os-3/runtime-platform/slices/RP-004-workspace-runtime/IMPLEMENTATION_REPORT.md
docs/nextshift-os-3/MASTER_INDEX.md
```

---

## Functional Requirements

The implementation must support:

1. Workspace runtime creation
2. Workspace runtime identity
3. Workspace runtime lifecycle
4. Workspace state snapshot creation
5. Workspace validation
6. Workspace isolation
7. Workspace metadata support
8. Typed runtime workspace errors
9. Public exports from package root
10. Unit tests for workspace behavior

---

## Suggested Public API

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

---

## Boundary Rules

The Workspace Runtime must not:

- Store secrets.
- Depend on product-specific domain models.
- Depend on browser or UI APIs.
- Persist workspaces externally.
- Implement capability, event, permission, or diagnostics behavior.
- Implement authentication provider behavior.
- Mutate runtime contexts owned by RP-002.
- Mutate runtime sessions owned by RP-003.

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

RP-004 is complete when:

- Workspace Runtime source files exist under `packages/runtime/src/workspace/`.
- Workspace Runtime tests pass.
- Package-level and root typecheck pass.
- RP-004 documentation exists and is linked.
- No RP-005 or later slice behavior is implemented.
- No generated artifact ZIP is committed.
