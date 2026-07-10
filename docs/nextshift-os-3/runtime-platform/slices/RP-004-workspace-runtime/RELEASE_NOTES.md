# RP-004 Release Notes

## Project

Runtime Platform v1.0

## Slice

RP-004 Workspace Runtime

## Release Date

2026-07-07

## Release Status

Released

## Summary

RP-004 adds the Workspace Runtime layer to `@nextshift/runtime`.

This release provides typed runtime workspace creation, identity assignment, lifecycle state handling, activation, suspension, closure, snapshot generation, validation, workspace-scoped context isolation, session workspace identity isolation, metadata support, forbidden metadata key protection, and a public workspace API exported from the package root.

## Delivered Capabilities

- Added `packages/runtime/src/workspace`.
- Implemented workspace runtime creation.
- Added runtime workspace lifecycle states:
  - `created`
  - `active`
  - `suspended`
  - `closed`
- Added runtime workspace identity.
- Added workspace-scoped runtime context binding.
- Added runtime session binding.
- Added workspace activation.
- Added workspace suspension.
- Added workspace closure.
- Added immutable workspace snapshots.
- Added runtime workspace validation.
- Added workspace isolation protection.
- Added runtime workspace metadata support.
- Added forbidden metadata key protection.
- Added typed `RuntimeWorkspaceError`.
- Added public package root exports.
- Added unit tests for workspace behavior.
- Added RP-004 implementation documentation.
- Added RP-004 verification and audit documentation.

## Public API

The runtime package exposes:

- `RuntimeWorkspace`
- `RuntimeWorkspaceMetadata`
- `RuntimeWorkspaceKind`
- `RuntimeWorkspaceIdentity`
- `RuntimeWorkspaceSnapshot`
- `CreateRuntimeWorkspaceInput`
- `RuntimeWorkspaceTransitionInput`
- `createRuntimeWorkspace`
- `activateRuntimeWorkspace`
- `suspendRuntimeWorkspace`
- `closeRuntimeWorkspace`
- `snapshotRuntimeWorkspace`
- `isRuntimeWorkspace`
- `isRuntimeWorkspaceIdentity`
- `RuntimeWorkspaceLifecycleState`
- `isTerminalRuntimeWorkspaceLifecycleState`
- `isRuntimeWorkspaceLifecycleState`
- `RuntimeWorkspaceError`
- `RuntimeWorkspaceErrorCode`
- `RuntimeWorkspaceErrorDetails`

## Validation Summary

| Check | Result |
| --- | --- |
| `pnpm --filter @nextshift/runtime test` | PASS |
| Runtime tests | 40 PASS |
| `pnpm --filter @nextshift/runtime typecheck` | PASS |
| `pnpm type-check` | PASS |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

## Audit Summary

Audit result: **PASS**

Audit confirmed:

- Required implementation files are present.
- Required public exports are available.
- Functional coverage satisfies RP-004 requirements.
- Unit tests cover workspace behavior.
- Scope boundary is preserved.
- Documentation is complete.
- RP-005 through RP-008 were not implemented prematurely.

## Known Limitations

- Workspace metadata secret protection checks top-level metadata keys only.
- Workspace metadata is in-memory only.
- Workspace snapshots are shallow immutable.
- External persistence and distributed workspace coordination are outside RP-004 scope.
- Authentication provider integration is outside RP-004 scope.

## Next Slice

RP-005 Capability Runtime.
