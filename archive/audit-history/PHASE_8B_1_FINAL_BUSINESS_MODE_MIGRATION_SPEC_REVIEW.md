# PHASE 8B.1 Final Business Mode Migration Spec Review

## Verdict

`APPROVE AS MIGRATION DIRECTION, REJECT AS EXECUTION-READY SPEC`

This final version fixes the biggest gaps from the prior draft:

- taxonomy is now decided
- read authority is named
- write authority is constrained
- legacy collapse order is stated

That is real progress.

But it still stops one layer short of an execution-ready migration spec, because the canonical persistence decision is still too abstract to drive implementation safely.

## What This Version Resolves Correctly

### 1. Taxonomy is now decisively resolved

This is the strongest improvement in the document.

It explicitly chooses:

- `retail`
- `recruitment`
- `hybrid`

and removes:

- `upgrade`

That is a coherent decision. It also matches the logic already surfaced in review: `upgrade` behaves like a funnel or lifecycle path, not a core business operating mode.

### 2. Authority boundaries are now much clearer

The document correctly forbids authority ownership by:

- localStorage
- query params
- defaults
- heuristics

That aligns with the completed audits and fixes the biggest conceptual problem in current runtime.

### 3. Read-path convergence is now explicit

Declaring:

`getBusinessModeSnapshot()`

as the single read path is the right kind of constraint. The previous draft did not actually name the canonical read entrypoint.

### 4. Legacy collapse order is now explicit

This is also an improvement. The prior draft only listed legacy sources. This one actually sets a collapse order:

1. query param
2. localStorage
3. defaults
4. heuristics

That is enough to reason about migration direction.

## Why It Is Still Not Execution-Ready

### 1. Canonical persistence is still underspecified

This remains the main blocker.

The document says:

`BusinessModeSnapshot = Dedicated authority object`

But that is not yet a concrete persistence decision.

It still does not answer:

- is this stored inside an existing table row
- is this stored in user metadata
- is this stored in a new dedicated table
- is this only a projection over another persisted source

For an execution-ready migration spec, “dedicated authority object” is too abstract.

### 2. Write authority is policy-level, not runtime-level

The allowed/forbidden list is directionally correct, but still not concrete enough for implementation.

It does not lock:

- which exact runtime creates the first persisted mode
- which exact runtime handles explicit user change
- where those writes land
- whether interview and explicit override write to the same persisted source

So the authority policy is clear, but the runtime write contract is not.

### 3. The read path is named, but not bound to a backing source

`getBusinessModeSnapshot()` is the right shape, but the document still does not define what it reads from in phase 1 versus after full migration.

That matters because current runtime has no canonical business mode source today.

### 4. “READY FOR MIGRATION” is too strong

Given the missing persistence/runtime binding, the status line:

`READY FOR MIGRATION`

overstates the current level of closure.

A more accurate state, based on repo evidence, is:

`READY FOR IMPLEMENTATION SPEC FINALIZATION`

or, at most:

`READY WITH CONDITIONS`

## Review Decision by Area

| Area | Decision | Reason |
| --- | --- | --- |
| Taxonomy | Approved | decisive and coherent |
| Authority ownership | Approved | correctly removes non-authoritative sources |
| Legacy collapse | Approved | explicit order now exists |
| Read path naming | Approved | canonical read path is now named |
| Persistence | Rejected | still too abstract |
| Runtime write contract | Rejected | not specific enough for implementation |
| Migration status | Rejected | `READY FOR MIGRATION` is premature |

## Final Review Decision

`APPROVE AS MIGRATION DIRECTION, REJECT AS EXECUTION-READY SPEC`

This document is now good enough to freeze the business-mode authority decision.

It is not yet the final implementation spec, because persistence and runtime write/read binding are still not concrete enough to execute safely.
