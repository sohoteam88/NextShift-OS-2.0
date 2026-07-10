# RP-005 Capability Runtime Repository Audit Contract

Version: 1.0

Status: Ready for Audit

Last Updated: 2026-07-07

---

## Purpose

Define the repository audit scope for RP-005 Capability Runtime.

The audit validates that the Capability Runtime implementation is complete, scoped, tested, documented, and ready for release checkpoint consideration.

---

## Audit Scope

Review RP-005 files:

```text
packages/runtime/src/capability/
packages/runtime/src/index.ts
packages/runtime/test/runtime-capability.test.ts
docs/nextshift-os-3/runtime-platform/slices/RP-005-capability-runtime/
docs/nextshift-os-3/runtime-platform/README.md
docs/nextshift-os-3/runtime-platform/PROJECT_PLANNING.md
docs/nextshift-os-3/MASTER_INDEX.md
```

Out of scope:

```text
docs/nextshift-os-3/context-package/
artifacts/
RP-006+
```

---

## Audit Checklist

### 1. File Completeness

Verify required implementation files exist:

- `runtime-capability.ts`
- `runtime-capability-lifecycle.ts`
- `runtime-capability-error.ts`
- `capability/index.ts`
- `runtime-capability.test.ts`

### 2. Public API

Verify public exports include:

- `RuntimeCapability`
- `RuntimeCapabilityIdentity`
- `RuntimeCapabilityLifecycleState`
- `RuntimeCapabilitySnapshot`
- `RuntimeCapabilityError`
- `RuntimeCapabilityErrorCode`
- `RuntimeCapabilityErrorDetails`
- `createRuntimeCapability`
- `activateRuntimeCapability`
- `suspendRuntimeCapability`
- `retireRuntimeCapability`
- `snapshotRuntimeCapability`
- `isRuntimeCapability`

### 3. Functional Coverage

Verify implementation supports:

- Capability runtime creation
- Capability identity assignment
- Capability lifecycle transitions
- Capability activation
- Capability suspension
- Capability retirement
- Capability state snapshot creation
- Capability validation
- Capability-scoped context isolation
- Workspace identity isolation
- Session workspace identity isolation
- Capability metadata support
- Forbidden metadata key protection
- Typed errors

### 4. Test Coverage

Verify tests cover:

- Capability creation
- Capability identity assignment
- Capability-scoped runtime context binding
- Runtime workspace binding
- Runtime session binding
- Non-capability context isolation failures
- Workspace identity mismatch failures
- Session workspace identity mismatch failures
- Capability lifecycle transitions
- Invalid lifecycle transitions
- Snapshot immutability
- Invalid identity failures
- Forbidden metadata key failures
- Invalid runtime capability candidates

### 5. Scope Boundary

Verify RP-005 does not implement:

- RP-006 Event Runtime
- RP-007 Runtime Permission Boundary
- RP-008 Runtime Platform Consolidation
- UI behavior
- API routes
- Persistence
- Product-specific capability behavior
- Capability execution behavior

### 6. Documentation Quality

Verify:

- RP-005 planning documents exist.
- RP-005 README exists.
- RP-005 implementation report exists.
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

RP-005 may proceed to Stop C only if:

- Required implementation files exist.
- Validation passes.
- Scope boundary is preserved.
- Required documentation exists.
- No blocking audit findings remain.
