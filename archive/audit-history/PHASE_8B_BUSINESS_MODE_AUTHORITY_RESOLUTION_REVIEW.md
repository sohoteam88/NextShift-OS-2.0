# PHASE 8B Business Mode Authority Resolution Review

## Verdict

`APPROVE AS ARCHITECTURE DIRECTION`

The direction is correct. The current audits already proved that business mode has no canonical runtime authority, and this document chooses the only option that fits the V7 authority model: make business mode an explicit business-identity fact owned by Interview Authority.

This is the right call because current runtime business mode is fragmented across:

- `localStorage['nextshift.currentFunnel']`
- query param `type`
- hard-coded funnel defaults
- downstream heuristics

None of those are stable or auditable enough to remain authority.

## What This Document Gets Right

### 1. It asks the right authority question

The document correctly separates:

- business identity
from
- UI selection
- request-scoped funnel selection
- default context loading

That matches the runtime reality found in `TASK_003`: current sources answer different questions, which is why no canonical authority exists.

### 2. It retires the right things as authority

These decisions are sound:

- localStorage: retire as authority
- query param: retire as authority
- funnel defaults: retain as configuration, not authority
- industry heuristics: retire as authority, maybe keep as recommendation input

That is consistent with the completed precedence and conflict audits.

### 3. It picks the right owner

`Interview Authority` is the correct owner if business mode is meant to represent:

`How does this user operate their business?`

That is an explicit self-description, not an inferred state machine output and not a page preference.

## What Is Still Missing

### 1. `hybrid` does not align with current runtime taxonomy

Current runtime business mode surfaces use:

- `retail`
- `recruitment`
- `upgrade`

This document proposes:

- `retail`
- `recruitment`
- `hybrid`

That is not just a naming difference. It is a taxonomy change. Until that mismatch is explicitly resolved, consumer migration cannot be treated as straightforward.

### 2. “Legacy Business Mode” is not yet concretely defined

The proposed precedence:

1. Interview Mode
2. Legacy Business Mode
3. Fallback Retail

is directionally fine, but the repo currently has multiple legacy business-mode sources, not one:

- localStorage
- query param
- defaults
- metadata custom funnel contexts
- heuristics

So `Legacy Business Mode` is still too vague as written.

### 3. Write authority is implied, not nailed down

The document correctly says there should be one write path, but it does not yet lock:

- where the field is persisted
- which runtime writes it first
- which runtime is allowed to edit it later

That omission is acceptable for a direction doc, but it means this is not yet an execution contract.

## Readiness Assessment

Based on the existing audits, my judgment is:

- authority decision: `READY`
- migration planning for BusinessMode: `READY WITH CONDITIONS`
- implementation start: `NOT READY`

The blockers are not conceptual anymore. They are concrete:

1. unresolved taxonomy mismatch: `upgrade` vs `hybrid`
2. undefined legacy-source collapse rule
3. no defined canonical persistence/write path yet

## Final Review Decision

`APPROVE AS ARCHITECTURE DIRECTION`

This document resolves the right problem in the right direction. It should be treated as the authority-choice decision, not as implementation-ready migration spec.
