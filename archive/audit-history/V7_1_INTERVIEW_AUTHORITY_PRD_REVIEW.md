# V7.1 Interview Authority PRD Review

## Verdict

This is the right V7.1 scope.

Compared with the broader V7 document, this PRD is much better focused. It isolates the real missing authority:

- who the user is
- what business they are building
- who they want to help
- what normalized downstream context other modules are allowed to consume

That is the correct first move.

My conclusion:

`APPROVE DIRECTION, TIGHTEN CONTRACTS BEFORE IMPLEMENTATION`

## What This PRD Gets Right

### 1. It identifies the correct authority boundary

The strongest statement in the PRD is this one:

```text
Every downstream system must consume interview-derived projections.
No module may independently redefine the user.
```

That is exactly the right architecture rule.

It matches the cleanup pattern already established in V6:

- one authority
- stable projections
- consumers read projections, not ad hoc source logic

### 2. It puts the authority at the right layer

The current code already has a functioning interview execution engine:

- [InterviewStepClient.tsx](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/brand-builder/components/wizard/InterviewStepClient.tsx)
- [brand-interview-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/brand-builder/services/brand-interview-service.ts)

So the right V7.1 move is not to replace that runtime first.
The right move is to make its outputs canonical.

This PRD understands that.

### 3. It defines the right class of contracts

These four contracts are the correct ones to formalize:

- `InterviewProfileSnapshot`
- `BusinessModeSnapshot`
- `AudienceSnapshot`
- `BusinessContextSnapshot`

Those are exactly the projections needed to stop downstream modules from inventing their own versions of:

- audience
- positioning
- business type
- user goal

## What Already Exists In Runtime

The current runtime is not blank. It already covers a large part of the PRD's intent.

Current implemented chain:

```text
/brand-builder/step/interview
  -> InterviewStepClient
  -> /api/v1/brand-builder/interview
  -> brandInterviewService
  -> AI dialogue loop
  -> extractedProfile
  -> confirmProfile
  -> BrandProfile + metadata.brand_profile
```

Current dialogue slots:

- `current_occupation`
- `previous_experience`
- `hidden_expertise`
- `preferred_audience`
- `future_goal`
- `personal_story`

Current extraction output already includes fields such as:

- identity
- audience
- positioning
- content pillars
- value proposition
- differentiator
- recommended platforms

So V7.1 does not need to create interview intelligence from nothing.
It needs to canonicalize and normalize what already exists.

## The Main Gaps

### 1. `BusinessModeSnapshot` does not exist in current runtime

This is still the largest missing authority.

The codebase does contain many `retail` and `recruitment` concepts, but they are fragmented across funnel, blueprint, and content logic:

- [funnel-context.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/types/funnel-context.ts)
- [funnel-os route](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/funnel-os/route.ts)
- [content-pillar-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/content-engine/services/content-pillar-service.ts)

That means the PRD is correct to introduce `BusinessModeSnapshot`, but it is not yet grounded in a single current authority.

### 2. `InterviewProfileSnapshot` is close, but not 1:1 with current data

The proposed contract includes:

- `ageRange`
- `location`
- `occupation`
- `previousExperience`
- `hiddenExpertise`
- `personalStory`
- `transformationStory`
- `missionStory`
- `completeness`

Current runtime only reliably collects some of these.

What is already available or derivable:

- occupation
- previous experience
- hidden expertise
- personal story
- future goal
- completeness

What is not currently first-class:

- age range
- location
- transformation story
- mission story

So this contract is directionally right, but it currently mixes:

- real runtime facts
- fields that would need new extraction logic

That means the PRD should distinguish:

- `Phase 1 required fields`
- `Phase 2 enrichment fields`

### 3. `AudienceSnapshot` is valid, but its source must be explicit

The PRD says Audience should be canonical under Interview Authority.

That is correct.

But current runtime has two possible upstream sources:

1. direct dialogue slots such as `preferred_audience`
2. extracted profile fields like:
   - `target_audience`
   - `audience_pain_points`
   - `audienceGoals`
   - `audienceObjections`

Implementation must choose a clear rule:

- source of truth for projection
- fallback order
- confidence rules when dialogue and extracted profile disagree

Without that, AudienceSnapshot will become another mixed authority.

### 4. `BusinessContextSnapshot` is the right shape, but too ambitious for first cut

The PRD includes:

- recommended platforms
- recommended content pillars
- recommended lead machine
- recommended sales flow

This is good as a target contract, but these are not all the same class of data.

Two are near-term and already close:

- recommended platforms
- recommended content pillars

Two are more downstream-strategy outputs:

- recommended lead machine
- recommended sales flow

Those should probably not all land in the same implementation phase.

Otherwise V7.1 will quietly become a strategy engine project instead of an authority project.

## What Should Be Tightened Before Implementation

### 1. Split raw facts from derived strategy

The contracts should distinguish:

- `interview facts`
- `derived recommendations`

For example:

`InterviewProfileSnapshot`, `BusinessModeSnapshot`, and `AudienceSnapshot`
should be factual projections.

`BusinessContextSnapshot`
should be allowed to contain derived recommendations.

That separation matters because downstream modules will trust factual authority more than heuristic strategy.

### 2. Add confidence semantics per projection

`BusinessModeSnapshot` already includes `confidence`.
The others should likely do the same or expose completeness/coverage clearly.

At minimum:

- `InterviewProfileSnapshot.completeness`
- `AudienceSnapshot.confidence`
- `BusinessContextSnapshot.readiness`

Otherwise consumers will treat partial interview output as if it were final.

### 3. Define source precedence

The PRD needs one explicit section:

```text
Projection Source Precedence
```

Example:

1. confirmed interview extraction
2. latest extracted profile
3. live dialogue slot state
4. legacy metadata fallback

If this is not explicit, different consumers will improvise.

### 4. Define consumer boundaries

The PRD says downstream consumers exist, but it should lock which modules are allowed to consume which projection first.

Recommended first-wave consumers:

- Brand / Brand DNA
- Brand Intelligence
- Social Setup

Recommended later consumers:

- Content Engine
- Lead Machine
- CRM
- WhatsApp AI

That phased consumer list is important. Otherwise the first implementation will spread too wide.

## Recommended Implementation Order

If this PRD proceeds, the order should be:

### V7.1A

Create canonical types only:

- `InterviewProfileSnapshot`
- `BusinessModeSnapshot`
- `AudienceSnapshot`
- `BusinessContextSnapshot`

No consumer migration yet.

### V7.1B

Create Interview Authority projection layer:

- projection service
- read-only adapters from current `brandInterviewService` / `BrandProfile` / metadata
- confidence and completeness rules

### V7.1C

Add read hooks and API routes.

### V7.1D

Migrate first-wave consumers:

- Brand Builder
- Brand Intelligence
- Social Setup

### V7.1E

Audit downstream mode-specialized systems before touching:

- Content
- Funnel
- CRM
- WhatsApp AI

## Final Recommendation

This is the correct V7.1 problem statement.

It is materially better than the larger V7 PRD because it focuses on authority rather than trying to implement the whole business OS at once.

The key thing still missing is rigor around:

- factual vs derived outputs
- source precedence
- phased consumer rollout
- field maturity between current runtime and future target contract

So the right decision is:

`APPROVE AS ARCHITECTURE DIRECTION`

but do not start implementation from this document alone until it adds:

1. source precedence rules
2. phase-1 vs phase-2 field classification
3. first-wave consumer inventory
4. factual vs derived contract separation

Once those are added, this becomes a solid implementation foundation rather than just a good product thesis.
