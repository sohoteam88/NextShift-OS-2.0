# PHASE 8B.2 Business Mode Implementation Spec Review

## Verdict

`APPROVE AS CONTRACT DIRECTION, REJECT AS IMPLEMENTATION-READY SPEC`

This document is stronger than the previous migration spec because it finally moves from policy language toward a runtime contract:

- owner is named
- snapshot shape is named
- persistence boundary is constrained
- write/read authority is constrained
- legacy retirement order is stated

That is the right direction.

But it is still not implementation-ready, because the contract is only named, not yet bound to concrete runtime objects that exist in this repo.

## What This Spec Gets Right

### 1. It correctly keeps Business Mode under Interview Authority

That matches the completed Phase 8A audits and the earlier Phase 8B authority review.

Current runtime business mode is still fragmented across active sources such as:

- `localStorage['nextshift.currentFunnel']` in `src/components/funnel-operating-system/useFunnelPreference.ts`
- query param `type` in `src/app/api/v1/funnel-os/route.ts`
- hard-coded funnel defaults in `src/modules/funnel/services/funnel-context-provider.ts`

So the decision to make Interview Authority the canonical owner remains correct.

### 2. The snapshot shape is coherent

This contract is internally consistent:

- `mode: retail | recruitment | hybrid`
- `confidence`
- `source: interview | explicit_override`

That is a valid target shape for a canonical projection.

### 3. The forbidden authority list is correct

These prohibitions are right and consistent with repo reality:

- no localStorage authority
- no query param authority
- no default authority
- no heuristic authority
- no funnel-service authority

Those are all currently active legacy sources, not trustworthy business identity sources.

### 4. The read-path rule is the right rule

Declaring:

`getBusinessModeSnapshot()`

as the single read entrypoint is the correct shape for migration.

## Why It Is Still Not Implementation-Ready

### 1. `InterviewAuthoritySnapshot` does not exist in current runtime

This is the main blocker.

The document says Business Mode is stored inside:

`InterviewAuthoritySnapshot`

But no concrete runtime type, table, service, or projection with that name exists in the repo today.

The live interview chain is still centered on:

- `BrandInterview.answers`
- `BrandInterview.extractedProfile`
- `brandInterviewService.confirmProfile()`

in `src/modules/brand-builder/services/brand-interview-service.ts`

So the persistence target is conceptually named, but not concretely defined.

### 2. `getBusinessModeSnapshot()` does not exist yet

The spec names the canonical read path, but there is no runtime implementation yet.

Current consumers still read business mode from legacy sources, including:

- `useFunnelPreference()` in `src/components/funnel-operating-system/useFunnelPreference.ts`
- `/api/v1/funnel-os` in `src/app/api/v1/funnel-os/route.ts`
- `getAllFunnelContexts()` chain identified in `audit/interview-authority-consumer-inventory.md`

So the read contract is correct as a target, but not yet executable.

### 3. The taxonomy decision still does not match active runtime taxonomy

The spec freezes:

- `retail`
- `recruitment`
- `hybrid`

But active runtime still uses:

- `retail`
- `recruitment`
- `upgrade`

Examples:

- `src/modules/funnel/types/funnel-context.ts`
- `src/components/funnel-operating-system/useFunnelPreference.ts`
- `src/app/api/v1/funnel-os/route.ts`
- `src/modules/funnel/services/funnel-context-provider.ts`

That means implementation still needs an explicit mapping rule for existing `upgrade` consumers. The spec removes ambiguity at the architecture layer, but not yet at the migration layer.

### 4. The write contract is still too abstract

The spec allows writes from:

- Interview Completion
- Interview Update
- Explicit User Change

That is directionally right, but still not runtime-specific enough.

It does not yet lock:

- which exact API/service writes the first persisted mode
- whether mode is derived from `BrandInterview.answers`, `extractedProfile`, or edited confirmation payload
- where explicit override is stored
- whether interview write and explicit override write the same persisted field

Without that, two developers could implement materially different authorities while both claiming compliance.

### 5. The document skips phase-1 compatibility rules

This repo still has active consumers on legacy business mode.

So an implementation-ready spec also needs to say:

- what `getBusinessModeSnapshot()` returns before all consumers migrate
- how `upgrade` is normalized during transition
- whether missing canonical mode falls back to legacy collapse or returns unknown

That compatibility layer is not optional here because the old consumers are still live.

## Readiness Assessment

My judgment based on current repo evidence:

- authority direction: `READY`
- contract shape: `READY WITH CONDITIONS`
- implementation start: `NOT READY`

## Final Review Decision

`APPROVE AS CONTRACT DIRECTION, REJECT AS IMPLEMENTATION-READY SPEC`

This spec is good enough to freeze the intended runtime shape.

It is not yet safe to call implementation-ready, because the named authority objects and read/write entrypoints still do not exist in the codebase as concrete runtime contracts.
