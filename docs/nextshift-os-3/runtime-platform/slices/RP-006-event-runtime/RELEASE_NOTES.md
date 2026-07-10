# RP-006 Release Notes

## Project

Runtime Platform v1.0

## Slice

RP-006 Event Runtime

## Release Date

2026-07-07

## Release Status

Released

## Summary

RP-006 adds the Event Runtime layer to `@nextshift/runtime`.

This release provides typed runtime event creation, event identity, event type validation, payload support, metadata support, timestamping through `occurredAt`, immutable snapshot generation, validation, event-scoped context isolation, workspace identity isolation, session workspace identity isolation, capability identity isolation, forbidden payload and metadata key protection, and a public event API exported from the package root.

## Delivered Capabilities

- Added `packages/runtime/src/event`.
- Implemented runtime event creation.
- Added runtime event identity.
- Added runtime event type validation.
- Added runtime event payload model.
- Added runtime event metadata support.
- Added runtime event timestamping through `occurredAt`.
- Added immutable runtime event snapshots.
- Added runtime event validation.
- Added event-scoped runtime context binding.
- Added runtime workspace binding.
- Added runtime session binding.
- Added runtime capability binding.
- Added event isolation protection.
- Added forbidden payload key protection.
- Added forbidden metadata key protection.
- Added typed `RuntimeEventError`.
- Added public package root exports.
- Added unit tests for event behavior.
- Added RP-006 implementation documentation.
- Added RP-006 verification and audit documentation.

## Public API

The runtime package exposes:

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

## Validation Summary

| Check | Result |
| --- | --- |
| `pnpm --filter @nextshift/runtime test` | PASS |
| Runtime tests | 64 PASS |
| `pnpm --filter @nextshift/runtime typecheck` | PASS |
| `pnpm type-check` | PASS |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

## Audit Summary

Audit result: **PASS**

Audit confirmed:

- Required implementation files are present.
- Required public exports are available.
- Functional coverage satisfies RP-006 requirements.
- Unit tests cover event behavior.
- Scope boundary is preserved.
- Documentation is complete.
- RP-007 and RP-008 were not implemented prematurely.

## Known Limitations

- Event type is a runtime-validated string alias, not a branded TypeScript type.
- Event payload and metadata secret protection checks top-level keys only.
- Event payload, metadata, and snapshots are shallow immutable.
- Event records are in-memory only.
- External persistence, event bus dispatch, queueing, and transport are outside RP-006 scope.
- Permission and diagnostics runtime behavior is outside RP-006 scope.

## Next Slice

RP-007 Runtime Permission Boundary.
