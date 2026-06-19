# V7 AI Interview Agent PRD Review

## Verdict

Direction is correct.

The product thesis matches the current strongest path in the codebase:

- system learns user first
- interview drives downstream business setup
- user should experience "what is my next step?" rather than "which module do I click?"

But this PRD is too broad to implement as one initiative. It mixes:

- interview agent
- business mode classification
- brand extraction
- social setup
- content generation
- funnel generation
- CRM specialization
- WhatsApp AI specialization
- journey redesign
- dashboard mission redesign

That is not one PRD. It is a V7 program.

## What Already Exists

There is already a real interview runtime, and it is much further along than the PRD assumes.

Current implemented chain:

```text
/brand-builder/step/interview
  -> InterviewStepClient
  -> /api/v1/brand-builder/interview
  -> brandInterviewService
  -> AI dialogue turns
  -> extractBrandProfile()
  -> confirmProfile()
  -> BrandProfile + metadata.brand_profile
  -> Brand DNA / Brand Intelligence / Social Setup downstream
```

Relevant runtime entry points:

- [InterviewStepClient.tsx](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/brand-builder/components/wizard/InterviewStepClient.tsx)
- [brand-interview-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/brand-builder/services/brand-interview-service.ts)
- [/api/v1/brand-builder/interview](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/brand-builder/interview/route.ts)
- [/api/v1/brand-builder/interview/[id]/message](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/brand-builder/interview/[id]/message/route.ts)
- [/api/v1/brand-builder/interview/[id]/finish](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/brand-builder/interview/[id]/finish/route.ts)
- [/api/v1/brand-builder/interview/[id]/extract](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/brand-builder/interview/[id]/extract/route.ts)

The current interview system already has:

- voice-first capable path
- text fallback
- conversational AI turns
- slot collection
- soft/hard turn limits
- extraction into structured profile
- confirmation step
- write-through into canonical `BrandProfile`

So the core V7 premise is not "build interview from zero". It is "promote the interview agent to the primary business operating entrypoint".

## What The Current Interview Already Collects

Current dialogue slots:

- `current_occupation`
- `previous_experience`
- `hidden_expertise`
- `preferred_audience`
- `future_goal`
- `personal_story`

This is close to the PRD's Stage 1 to Stage 5 structure, but not identical.

PRD stages:

1. Personal Identity
2. Business Direction
3. Personal Story
4. Audience Discovery
5. Strength Discovery

Current system already covers most of:

- what they currently do
- previous experience
- hidden expertise
- preferred audience
- future goal
- personal story

What is missing or under-specified relative to the PRD:

- explicit `Retail / Recruitment / Hybrid` business mode authority
- explicit geography / age / demographic profile storage
- explicit split outputs for `Origin Story / Transformation Story / Mission Story`
- explicit downstream path specialization contract

## Strong Alignment With Current Architecture

The PRD is strongest where it matches the existing authority structure:

### 1. Interview as progression gate

This already exists in the evolution and mission layers:

- `brand_interview` is a real milestone
- progression logic already reads it

Relevant files:

- [derive-level.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/evolution/core/derive-level.ts)
- [mission-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/mission-engine/services/mission-service.ts)

### 2. Interview as source for Brand DNA

This already exists:

- extracted interview profile feeds Brand DNA regeneration and confirmation
- canonical brand outputs flow into `BrandProfile`

Relevant files:

- [brand-interview-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/brand-builder/services/brand-interview-service.ts)
- [brandDnaService.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/brand-dna/services/brandDnaService.ts)

### 3. Interview as driver for "next step"

This also matches current direction:

- Dashboard and Journey are already moving toward mission-first progression
- V6 consolidation has already been reducing module-first logic

## Main Gaps

### 1. No canonical business mode authority

The PRD assumes:

```text
Retail | Recruitment | Hybrid
```

as a first-class system switch.

Current runtime does not have a single canonical `businessMode` authority that downstream systems consume consistently.

Without that, these PRD claims are still aspirational:

- retail content vs recruitment content
- retail CRM vs recruitment CRM
- retail WhatsApp AI vs recruitment WhatsApp AI
- hybrid dual-output generation

This is the biggest architectural gap.

### 2. The interview output contract is still "brand profile extraction", not "business operating profile"

Current extraction prompt outputs brand-oriented fields such as:

- positioning
- audience
- content pillars
- personality
- value proposition
- recommended platforms

That is enough for Brand DNA and Social Setup, but not enough to safely drive:

- lead machine type
- funnel archetype
- CRM specialization
- sales assistant behavior
- team/recruitment system mode

The current contract is too narrow for the PRD's downstream ambitions.

### 3. Dashboard / Today OS is not fully interview-driven yet

The PRD wants:

```text
Dashboard = Today
not Modules
```

Current product is closer than before, but still mixed:

- some mission-based next-step logic exists
- module surfaces still exist as primary operating areas
- business-mode-specific task generation is not canonical

So the PRD is directionally right, but the execution dependency is bigger than the interview itself.

### 4. Voice-first exists, but not as the primary OS shell

Voice upload and transcript extraction already exist, but voice is still a mode inside Brand Builder.

It is not yet:

- the first-login primary entrypoint
- the canonical operating shell
- the singular onboarding authority

## Risks In The PRD

### Risk 1: Too much product surface under one spec

This PRD spans at least five independent authorities:

- interview authority
- business mode authority
- content strategy authority
- lead machine authority
- daily mission authority

If implemented as one initiative, it will create the same multi-authority drift that V6 spent time removing.

### Risk 2: "Automatically generate everything" without authority boundaries

The PRD says the system should auto-generate:

- Brand Profile
- Brand Intelligence
- Brand DNA
- Social Strategy
- landing pages
- CRM
- WhatsApp AI

That is only safe if each downstream module consumes a canonical interview-derived projection, not raw interview JSON and not ad hoc helper logic.

Right now those downstream canonical projections are incomplete.

### Risk 3: Retail / Recruitment / Hybrid can become another parallel truth

If this is added casually to:

- interview extraction
- dashboard logic
- content engine
- CRM
- WhatsApp AI

without a single projection contract, V7 will recreate exactly the fragmentation V6 was cleaning up.

## What Should Change In The PRD

This PRD should be split.

Recommended decomposition:

### V7.1 Interview Authority

Goal:

- define the canonical AI Interview Agent contract
- define the canonical output schema
- define the handoff to Brand Profile / Brand Intelligence / downstream systems

### V7.2 Business Mode Projection

Goal:

- establish `Retail | Recruitment | Hybrid` as a canonical projection
- specify consumers:
  - content engine
  - lead engine
  - CRM
  - WhatsApp AI
  - dashboard mission system

### V7.3 First Login AI Entry

Goal:

- move first-login onboarding to AI Interview as primary shell
- keep existing Brand Builder internals as execution engine initially

### V7.4 Downstream Mode-Specialized Generators

Goal:

- content specialization
- funnel specialization
- CRM specialization
- WhatsApp specialization

### V7.5 Today OS / Daily Mission Refactor

Goal:

- make "what should I do next?" the visible primary experience
- consume canonical interview + business mode outputs

## Recommended Canonical Contracts

This PRD needs at least these contracts before implementation starts:

### 1. Interview Profile Snapshot

Canonical read model for what the system learned about the user.

Should include:

- identity
- occupation
- story
- audience
- expertise
- goals
- confidence / completeness

### 2. Business Mode Snapshot

Canonical authority:

- `retail`
- `recruitment`
- `hybrid`

with:

- reason
- confidence
- downstream feature flags

### 3. Interview Readiness / Completion Snapshot

Needed for:

- dashboard progression
- journey
- first-login flow
- retry / continue behavior

### 4. Interview-Derived Business Context Snapshot

This is the real bridge to the rest of the OS.

It should normalize the interview output into fields that downstream modules can safely consume.

## Final Recommendation

The product thesis is correct.

The architectural framing is not yet strict enough.

What is true today:

- you already have an AI interview runtime
- you already have a brand extraction pipeline
- you already have mission/evolution systems that can use interview completion
- you do not yet have a single business-mode authority
- you do not yet have a full interview-derived operating context contract

So the right call is:

`APPROVE DIRECTION, REWORK STRUCTURE`

Do not implement this PRD as one large V7 feature.

Turn it into a staged architecture program where the first deliverable is:

```text
AI Interview Authority
-> canonical Interview Profile projection
-> canonical Business Mode projection
-> consumer inventory
```

Only after that should the team touch:

- first-login shell
- dashboard mission redesign
- retail/recruitment specialized generation
- WhatsApp AI specialization

Without those boundaries, V7 will accumulate new parallel truths faster than the current codebase can absorb.
