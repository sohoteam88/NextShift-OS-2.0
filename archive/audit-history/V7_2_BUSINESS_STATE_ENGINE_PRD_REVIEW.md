# V7.2 Business State Engine PRD Review

## Verdict

This is the right next architectural move after V7.1.

If V7.1 answers:

```text
Who is this user?
```

then V7.2 should answer:

```text
Where is this business now?
```

That division is sound.

My conclusion:

`APPROVE DIRECTION, BUT TIGHTEN BOUNDARIES WITH JOURNEY / MISSION / FUNNEL BEFORE IMPLEMENTATION`

## What This PRD Gets Right

### 1. It identifies the actual missing authority

The strongest part of the PRD is this boundary:

- Stage Detection
- Readiness Scoring
- Bottleneck Detection
- Opportunity Detection
- Priority Ranking
- Mission Generation

That is exactly the layer the product still lacks as a single authority.

Today the codebase has pieces of this spread across:

- mission engine
- dashboard mission helpers
- journey logic
- funnel progress logic
- funnel next action logic
- funnel health logic

So the need is real.

### 2. It distinguishes diagnostic authority from execution modules

This sentence is correct:

```text
Its responsibility is not to generate content, funnels, landing pages, or sales scripts.
Its responsibility is to determine where the business currently is, what is preventing growth, and what should happen next.
```

That is the right cut.

If implemented correctly, Business State Engine becomes a read-and-diagnose layer, not another feature silo.

### 3. The stage model is product-comprehensible

These proposed stages are understandable:

- `foundation`
- `audience`
- `lead_generation`
- `sales`
- `systemization`
- `scale`

They are much cleaner as a business narrative than many current module-driven states.

## Why This PRD Matters In This Codebase

The current product still has multiple competing ways to answer "what's next?" and "how healthy is this business?"

Relevant existing realities:

- mission progression logic in [mission-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/mission-engine/services/mission-service.ts)
- dashboard mission logic in [useDashboardMission.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/dashboard/hooks/useDashboardMission.ts)
- funnel progress logic in [funnel-progress-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-progress-service.ts)
- funnel next action / bottleneck logic in [funnel-health-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-health-service.ts)
- journey next action logic in [getNextJourneyAction.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/journey/utils/getNextJourneyAction.ts)

This PRD is basically proposing to unify the diagnostic answers those systems currently compute separately.

That is the right problem to solve.

## Main Architectural Strength

The strongest idea here is:

```text
Interview Authority -> Business State Engine -> Journey Engine
```

This is good because it creates a layered system:

1. Interview Authority:
   - factual user truth
2. Business State Engine:
   - diagnostic business truth
3. Journey Engine:
   - prescribed next-step workflow truth

That layering is coherent.

If kept strict, it prevents downstream modules from inventing their own maturity models.

## Main Risks

### 1. It overlaps with existing Mission / Journey authority

The PRD says Business State Engine owns:

- priorities
- mission
- what should happen next

But the current architecture already has active mission and journey authorities.

That means V7.2 will fail unless it explicitly defines:

- what Business State Engine owns
- what Journey Engine owns
- what Mission Engine keeps or loses

Without that, you will create another parallel truth.

This is the biggest implementation risk.

### 2. `BusinessStage` may conflict with current progression systems

Current code already tracks progression in several forms:

- evolution / mission progress
- journey checklist completion
- funnel progress by `BusinessFunnelType`

The new `BusinessStage` values:

- `foundation`
- `audience`
- `lead_generation`
- `sales`
- `systemization`
- `scale`

do not map 1:1 to any current live progression contract.

That is fine in theory, but the PRD must decide:

- is `BusinessStage` replacing existing mission stage concepts?
- or is it a parallel diagnostic layer?

If it is parallel, consumers must know not to confuse:

- user progression stage
- business diagnostic stage

### 3. The output contract is still too large for a first cut

The proposed `BusinessState` includes:

- stage
- readiness
- bottlenecks
- opportunities
- priorities
- mission

That is a lot.

The first implementation should probably separate:

- business diagnosis
- mission prescription

Reason:

`mission` is action orchestration.
`stage / readiness / bottlenecks` are diagnosis.

If both are implemented together, the engine becomes harder to stabilize and harder to test.

### 4. Current funnel logic already behaves like a mini business-state engine

Existing funnel systems already do some of this:

- progress calculation
- bottleneck detection
- next action recommendation
- KPI framing by funnel type

Relevant files:

- [funnel-progress-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-progress-service.ts)
- [funnel-health-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-health-service.ts)
- [/api/v1/funnel-os/route.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/funnel-os/route.ts)

That means V7.2 must be careful not to create a second bottleneck engine beside funnel-os.

## What Must Be Clarified Before Implementation

### 1. Relationship to Journey Engine

The PRD says:

```text
Business State Engine answers:
Where is your business now?

Journey Engine answers:
What should happen next?
```

Good.

But later the PRD also gives Business State Engine:

- priority ranking
- mission generation

That starts to overlap.

Recommendation:

- Business State Engine owns diagnosis
- Journey Engine owns orchestration and sequence
- Mission Engine, if retained, should become a consumer or adapter, not a competing authority

### 2. Relationship to funnel-specific progress

You already have `BusinessFunnelType` and several funnel-specific progress models:

- `retail`
- `recruitment`
- `upgrade`

Those are not the same thing as:

- `foundation`
- `audience`
- `lead_generation`
- `sales`
- `systemization`
- `scale`

The PRD needs an explicit rule:

```text
BusinessStage is business-wide.
Funnel progress is channel- or funnel-specific.
```

Without that, consumers will map them incorrectly.

### 3. Input contract needs harder boundaries

The PRD currently lists:

- Interview Facts
- Business Inference
- Strategy Projection

That is the right shape, but each input class needs a source declaration.

For example:

- `InterviewFacts`
  - source: Interview Authority projections
- `BusinessInference`
  - source: derived by Business State Engine itself, not by downstream modules
- `StrategyProjection`
  - source: should be read from canonical strategy/readiness projections, not invented ad hoc

Otherwise Business State Engine will inherit unstable upstream inputs.

### 4. Readiness domains need measurable upstream signals

The proposed readiness dimensions:

- brand
- content
- leads
- sales
- team

are good, but the PRD currently does not define what each score is derived from.

Without measurable inputs, readiness becomes subjective and drifts.

For example:

- `brand`
  - likely from Brand Intelligence / Brand Health
- `content`
  - likely from content setup / publishing readiness
- `leads`
  - likely from funnel capture + CRM lead flow
- `sales`
  - likely from conversion / follow-up / appointment signals
- `team`
  - likely from recruitment or org readiness

This needs to be locked before implementation.

## Recommended Refinement

The PRD should be split into two layers:

### Layer 1: Diagnostic Core

Canonical outputs:

- `stage`
- `readiness`
- `bottlenecks`
- `opportunities`

This should be the first implementation target.

### Layer 2: Prescriptive Layer

Derived outputs:

- `priorities`
- `mission`

This should come after the diagnostic layer is stable.

That split will make the system easier to validate and easier to integrate with current mission/journey code.

## Recommended Implementation Order

### V7.2A

Create canonical types only:

- `BusinessState`
- `BusinessStage`
- `ReadinessScore`
- `Bottleneck`
- `Opportunity`
- `Priority`

No consumer migration.

### V7.2B

Implement Diagnostic Projection only:

- stage detection
- readiness scoring
- bottleneck detection
- opportunity detection

No mission generation yet.

### V7.2C

Audit and map consumers:

- dashboard
- journey
- funnel-os
- mission engine

Determine who should consume diagnostic state directly.

### V7.2D

Only then implement prescriptive outputs:

- priorities
- mission

And explicitly decide whether Mission Engine is replaced, wrapped, or kept as adapter.

## Final Recommendation

This PRD is strong.

It addresses a real authority gap in the current product and gives the right conceptual separation from Interview Authority.

The problem is not the direction.
The problem is the overlap risk with:

- Journey Engine
- Mission Engine
- Funnel OS progress / next-action logic

So the right decision is:

`APPROVE AS ARCHITECTURE DIRECTION`

with one condition:

Before implementation begins, the PRD must explicitly define:

1. Business State Engine vs Journey Engine boundary
2. Business-wide stage vs funnel-specific progress boundary
3. measurable readiness inputs per domain
4. whether mission generation is phase 1 or phase 2

If those are clarified, V7.2 can become the diagnostic SSOT the product currently lacks, instead of another smart-sounding parallel engine.
