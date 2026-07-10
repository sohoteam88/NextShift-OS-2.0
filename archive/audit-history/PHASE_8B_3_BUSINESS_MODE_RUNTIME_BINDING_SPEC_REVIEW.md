# PHASE 8B.3 Business Mode Runtime Binding Spec Review

## Verdict

`APPROVE AS PHASE-1 BINDING DIRECTION, REJECT AS EXECUTION-READY SPEC`

This is the first Business Mode spec in the Phase 8B chain that actually binds the target contract to concrete runtime storage and migration behavior.

That is real progress.

It fixes the biggest gap from 8B.2 by making an explicit phase-1 storage choice:

`user.metadata.business_mode`

and by introducing a concrete transition rule for:

`upgrade -> hybrid`

Those are the right kinds of decisions.

But it is still not execution-ready, because the named runtime binding does not yet line up cleanly with how this repo currently writes interview-confirmed data, and one part of the proposed adapter order conflicts with the completed audits.

## What This Spec Gets Right

### 1. Phase-1 storage finally becomes concrete

This is the strongest improvement over 8B.2.

The document no longer says “dedicated authority object” in the abstract. It now chooses a specific phase-1 storage target:

`user.metadata.business_mode`

That is a valid rollout tactic for this repo because:

- user metadata already exists
- interview confirmation already writes into user metadata
- it avoids schema work while the authority is still being introduced

As a migration tactic, this is defensible.

### 2. The phase split is coherent

The two-stage model is sensible:

- phase 1: `user.metadata.business_mode`
- phase 2: `InterviewAuthoritySnapshot.businessMode`

That is consistent with the broader V7 migration pattern:

`existing persistence -> canonical projection -> consumer migration -> retirement`

### 3. The `upgrade -> hybrid` mapping is finally explicit

This was missing before.

Current runtime still uses:

- `retail`
- `recruitment`
- `upgrade`

across active files such as:

- `src/components/funnel-operating-system/useFunnelPreference.ts`
- `src/app/api/v1/funnel-os/route.ts`
- `src/modules/funnel/types/funnel-context.ts`

So writing down the normalization rule:

`upgrade -> hybrid`

is necessary and correct.

### 4. The compatibility-layer idea is correct

This repo still has active legacy consumers on business mode.

So introducing a compatibility path during migration is the right idea:

- legacy consumers do not all cut over at once
- canonical read path must absorb old sources before retirement

That part of the spec is operationally realistic.

## Why It Is Still Not Execution-Ready

### 1. There is still no real runtime write path for `metadata.business_mode`

The spec names phase-1 storage, but the repo does not currently implement that write.

Most importantly, the allowed writer it cites:

`brandInterviewService.confirmProfile()`

does not currently write `metadata.business_mode`.

It writes:

- `metadata.brand_profile`
- `BrandProfile`

in `src/modules/brand-builder/services/brand-interview-service.ts`

So the spec chooses a storage target, but the actual runtime binding is still incomplete because the named writer does not yet persist the field.

### 2. `InterviewAuthoritySnapshot` still does not exist

The spec improves phase 1, but phase 2 still references:

`InterviewAuthoritySnapshot.businessMode`

That runtime object does not exist in the repo today.

So the document is still partly binding against a future authority object, not a current implementation artifact.

### 3. `getBusinessModeSnapshot()` is still only a named target

The document correctly requires:

- `getBusinessModeSnapshot()`
- `createBusinessMode()`
- `updateBusinessMode()`
- `resolveLegacyBusinessMode()`

But none of those exist in current runtime.

That means the binding contract is clearer than before, but still not yet executable as written.

### 4. The legacy adapter order conflicts with completed audit evidence

This is the main design problem in the spec.

The document proposes:

1. localStorage
2. query param
3. metadata.funnel_contexts
4. defaults
5. retail

But the completed precedence audit established that current runtime is consumer-local, not globally ordered:

- UI winner: localStorage
- API winner: query param
- service winner: explicit function argument

See:

- `audit/interview-authority-precedence-report.md`
- `audit/interview-authority-read-write-authority-map.md`

So this new order is not “the current runtime order.” It is a new migration policy.

That can be fine, but the spec does not say clearly enough that it is intentionally overriding observed runtime precedence rather than merely documenting it.

### 5. The compatibility section is still one layer too abstract

The document says:

`useFunnelPreference() -> Adapter -> BusinessModeSnapshot`

before migration, then:

`useFunnelPreference() -> getBusinessModeSnapshot()`

after migration.

But that still leaves open a concrete implementation question:

- does `useFunnelPreference()` become a pure consumer
- or does it remain a writer during the compatibility window

Right now it is both a reader and writer of:

`localStorage['nextshift.currentFunnel']`

in `src/components/funnel-operating-system/useFunnelPreference.ts`

That detail matters for execution because it changes whether localStorage is still an active authority or only an adapter-fed cache.

## Readiness Assessment

My judgment based on current repo evidence:

- authority direction: `READY`
- phase-1 storage choice: `READY`
- runtime binding design: `READY WITH CONDITIONS`
- implementation start: `NOT READY`

## Final Review Decision

`APPROVE AS PHASE-1 BINDING DIRECTION, REJECT AS EXECUTION-READY SPEC`

This is the best Business Mode spec so far because it finally picks a concrete phase-1 storage target and an explicit taxonomy mapping.

It is still not fully execution-ready because:

- the named phase-1 writer does not yet write `metadata.business_mode`
- the phase-2 authority object does not exist
- the adapter order is still a proposed migration policy, not a repo-backed runtime fact
- the compatibility behavior for `useFunnelPreference()` is not concrete enough yet
