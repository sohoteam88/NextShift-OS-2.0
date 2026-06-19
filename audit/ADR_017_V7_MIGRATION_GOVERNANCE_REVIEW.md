# ADR-017 V7 Migration Governance Review

## Verdict

Direction is correct.

This ADR is the governance layer that ADR-016 was missing.

ADR-016 defined the target architecture.
ADR-017 defines the migration law needed to actually get there.

My conclusion:

`APPROVE AS IMPLEMENTATION GOVERNANCE DIRECTION, WITH A FEW ENFORCEMENT DETAILS STILL MISSING`

## What This ADR Gets Right

### 1. It fixes the biggest failure mode directly

The strongest line in the ADR is:

```text
Architecture is not complete until legacy authorities are retired.
```

That is exactly correct.

This repo has already shown that the real failure mode is not "missing architecture".
It is:

- new authority created
- old authority left alive
- consumers split across both

This ADR addresses that directly.

### 2. The migration law is the right law

This is the correct sequence:

```text
Source Authority
-> Canonical Projection
-> Consumer Migration
-> Reference Audit
-> Legacy Retirement
```

That is the same pattern that already worked during the V6 evolution consolidation.

It is the right reusable migration formula.

### 3. The five-step rule is practical, not abstract

The ADR avoids vague governance language and gives a concrete order:

1. identify current authority
2. define canonical projection
3. migrate consumers
4. audit references
5. retire legacy authority

That is what implementation teams actually need.

This is strong because it turns architecture into an operational checklist.

### 4. The projection rule is correct

This is one of the most important rules in the document:

```text
Consumers may only read Projection Contracts
Consumers may not read Internal Services directly
```

That is the correct boundary.

Without that rule, every migration collapses because consumers keep reaching around the new layer and reading private logic anyway.

### 5. The closure condition is correctly strict

This line is correct:

```text
0 Runtime References
```

That must be the standard.

The migration is not complete when:

- a new service exists
- a projection exists
- one or two screens have been updated

It is only complete when the old authority has no runtime consumer left.

That is the right bar.

## Why This ADR Matters In This Codebase

This repository already proved why governance is necessary.

V6 cleanups repeatedly found the same structural bug:

- canonical layer introduced
- legacy helper still left active
- one or more hidden consumers still pointed to the old chain

That happened around:

- evolution / unlock logic
- dashboard mission logic
- CRM legacy engine
- sales legacy engine
- team legacy engine
- AI recommendation surfaces

So ADR-017 is not optional process overhead.
It is the rule set needed to stop the same mistake from repeating in V7.

## Main Architectural Strength

The strongest idea in this ADR is that migration is treated as a runtime discipline, not a documentation exercise.

That matters because architecture only becomes real when:

- consumers have moved
- references are gone
- old authority is retired

This ADR correctly defines those as mandatory completion criteria.

That is the right governance layer.

## Main Risks

### 1. `0 Runtime References` needs a sharper definition

This is the biggest missing detail.

The phrase is correct, but implementation will need to define what counts as runtime reference.

At minimum, governance should distinguish:

- production source imports
- route handlers
- active hooks
- active services
- UI consumers
- tests
- stories / examples
- audits / docs

Otherwise teams will argue over whether:

- test references are allowed
- adapters count as legacy
- route aliases count as consumer usage

The rule is right, but the counting standard needs to be explicit.

### 2. "Allowed: Adapter" is too loose unless time-boxed

The ADR says legacy retirement may use:

- delete
- archive
- adapter

Delete and archive are clear.

Adapter is dangerous unless the ADR also says:

- adapter is transitional only
- adapter must have an explicit retirement target
- adapter cannot become a permanent parallel authority

Without that, teams can comply on paper while keeping legacy logic alive indefinitely behind a wrapper.

### 3. The retirement matrix is right, but too small for current repo reality

These four rows are correct:

- Mission Service -> Journey Engine
- AI Coach Priorities -> AI COO
- AI Workforce Orchestration -> Agent Runtime
- Business Recommendations -> Growth Loop

But in this repo, migrations will also need governance around:

- Business State diagnosis helpers
- Interview-derived audience and context logic
- domain-local recommendation engines
- possibly some Brand and Funnel recommendation surfaces

So the matrix is a good start, but not yet a full migration inventory.

### 4. Enforcement is defined conceptually, not mechanically

This section is good:

- Contract
- Consumer List
- Migration Plan
- Retirement Plan

But approval blocking only works if there is some real enforcement mechanism.

Eventually this will need:

- PR checklist enforcement
- import-boundary checks
- consumer inventory updates
- route-level audits
- reference scans as part of merge criteria

Without that, the ADR is correct but still relies too much on manual discipline.

## What Must Be Tightened

### 1. Define the runtime reference categories

The ADR should specify that reference audits cover at least:

- `src/**` runtime imports
- route handlers
- hooks
- services
- component consumers

And should explicitly say whether these are excluded or separately tracked:

- tests
- docs
- archived files
- migration adapters

That makes the `0 Runtime References` rule enforceable.

### 2. Add an adapter retirement rule

If adapters are allowed, the ADR should say:

```text
An adapter is transitional infrastructure, not an endpoint.
Every adapter must declare:
- source authority
- target authority
- current consumers
- retirement condition
```

That prevents "temporary" bridges from turning into permanent architecture.

### 3. Require named consumer inventories for every migration

The current ADR says consumer migration is required.

Good.

But governance should require an explicit consumer list by name.

For example:

- routes
- hooks
- services
- dashboards
- agent surfaces

Without named consumers, migrations get declared complete too early.

### 4. Require proof artifact before retirement

Before deleting a legacy authority, the ADR should require evidence such as:

- reference audit output
- type-check success
- build success
- updated migration report

This repo has already benefited from that style of closure in V6 work.
It should be written into the rule.

## Relationship To ADR-016

ADR-016 said:

- this is the architecture

ADR-017 now says:

- this is how migration into that architecture must happen

That relationship is correct.

In practice:

- ADR-016 is the system law
- ADR-017 is the migration law

That is the right pairing.

## Final Judgment

This ADR is necessary, and it is pointed in the right direction.

It closes the most important gap left by ADR-016:

- not just where V7 should end up
- but how legacy authority must be removed on the way there

That is exactly the governance the repo needs.

My final judgment:

`APPROVE AS GOVERNANCE DIRECTION`

But before using it as a hard implementation gate, tighten:

- runtime reference definitions
- adapter retirement rules
- named consumer inventory requirements
- proof artifacts for closure

With those additions, ADR-017 would be strong enough to operate as real migration law rather than advisory process text.
