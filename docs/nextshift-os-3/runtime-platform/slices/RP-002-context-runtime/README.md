# RP-002 Context Runtime

Version: 1.0

Status: Ready for Release

Last Updated: 2026-07-07

---

## Purpose

RP-002 establishes the Context Runtime layer for Runtime Platform v1.0.

The Context Runtime creates, validates, scopes, snapshots, and propagates runtime context across kernel-managed execution boundaries.

---

## Functional Scope

Implemented:

- Runtime context creation
- Runtime context scope assignment
- Parent-child context derivation
- Correlation ID preservation
- Root context preservation
- Context snapshot creation
- Runtime context validation
- Scope isolation protection
- Runtime metadata support
- Forbidden metadata key protection
- Typed `RuntimeContextError`
- Public exports from package root
- Unit tests for context behavior

---

## Runtime Context Scopes

```text
kernel
workspace
session
capability
event
```

Scope derivation can move from broader runtime boundaries to narrower runtime boundaries, but not from narrower boundaries back to broader ones.

---

## Public API

```ts
RuntimeContext
RuntimeContextScope
RuntimeContextSnapshot
RuntimeContextError
createRuntimeContext
deriveRuntimeContext
snapshotRuntimeContext
isRuntimeContext
```

---

## Package

```text
packages/runtime/src/context/
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

Both commands passed for RP-002.

---

## Verification And Audit

- [Requirements Verification](REQUIREMENTS_VERIFICATION.md)
- [Repository Audit Contract](REPOSITORY_AUDIT_CONTRACT.md)

---

## Release Documentation

- [Release Notes](RELEASE_NOTES.md)
- [Release Checklist](RELEASE_CHECKLIST.md)
- [Approval Record](APPROVAL_RECORD.md)
- [Release Summary](RELEASE_SUMMARY.md)

---

## Next Step

Perform Git Release Checkpoint for RP-002, then continue to RP-003 Session Runtime.
