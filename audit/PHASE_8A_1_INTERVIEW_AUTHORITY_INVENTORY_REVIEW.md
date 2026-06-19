# Phase 8A.1 Interview Authority Inventory Review

## Verdict

Direction is correct.

This is the right first authority inventory to write, because Interview Authority sits at the bottom of the V7 stack and every downstream layer depends on it.

But in its current form, this document is still a skeleton, not a completed inventory.

My conclusion:

`APPROVE AS INVENTORY TEMPLATE DIRECTION, NOT AS A COMPLETED OR EXECUTION-READY INVENTORY`

## What This Inventory Gets Right

### 1. It starts with the right authority question

This is the correct question:

```text
Who is this user?
```

That matches the V7.1 boundary exactly.

This is important, because Interview Authority should not drift into:

- readiness diagnosis
- mission sequencing
- delegation
- execution

The document stays on the right layer.

### 2. It names the correct target projections

These four contracts are the right targets:

- `InterviewProfileSnapshot`
- `BusinessModeSnapshot`
- `AudienceSnapshot`
- `BusinessContextSnapshot`

That aligns with the earlier V7.1 review and with the real downstream needs in this codebase.

### 3. It recognizes the right current source categories

These categories are valid:

- Interview Runtime
- Profile Storage
- Extraction Logic
- Slot Collection

That is the correct structure for the source side.

It reflects the actual shape of the current repo better than a single flat list would.

### 4. It recognizes the right consumer classes

These consumer groups are directionally right:

- Brand Builder
- Brand Intelligence
- Social Setup
- Content Systems

That is a sensible first partition.

It correctly assumes Interview Authority is not a local brand-only concern.

## Why This Inventory Matters In This Codebase

Interview truth is already split across multiple runtime surfaces:

- interview dialogue runtime
- extraction output
- `BrandProfile`
- `metadata.brand_profile`

And downstream systems already consume pieces of that truth in inconsistent ways.

So a proper inventory here is not paperwork.
It is the prerequisite for preventing V7.1 from becoming another parallel-authority project.

## Main Architectural Strength

The strongest part of this document is that it is structured around the right migration dimensions:

- sources
- consumers
- source classification
- projection mapping
- dependency analysis
- retirement candidates

That is the right shape for an authority inventory.

If those sections are actually completed with real repo evidence, this would become a useful migration artifact.

## Main Risks

### 1. Almost every meaningful section is still `Unknown`

This is the biggest issue.

Right now the document says `Unknown` for:

- Interview Runtime status
- Profile Storage status
- Extraction Logic status
- Slot Collection status
- Brand Builder status
- Brand Intelligence status
- Social Setup status
- Content Systems status

That means this document has not yet done the actual inventory work.

As written, it is a checklist of what still needs to be audited, not the audit itself.

### 2. The source inventory is still too abstract

For example:

- `brandInterviewService`
- `InterviewStepClient`
- interview routes

are useful starting points, but not enough.

A real inventory needs named files and explicit responsibilities, such as:

- where slots are collected
- where extracted profile is built
- where confirmation writes happen
- where `BrandProfile` is updated
- where metadata fallback is still read

Without that, the migration cannot define source precedence or projection mapping safely.

### 3. The consumer inventory is still category-only, not runtime-specific

This is not enough:

- Brand Builder
- Brand Intelligence
- Social Setup
- Content Systems

A migration-ready inventory needs named consumers, such as:

- specific routes
- specific hooks
- specific services
- specific components
- specific API handlers

Otherwise "consumer migration" in later phases will still be guesswork.

### 4. The document does not yet resolve the biggest V7.1 problem: source precedence

This was already identified in the V7.1 review:

- confirmed extraction
- latest extraction
- dialogue slot state
- `BrandProfile`
- legacy metadata fallback

The inventory must map these explicitly.

Until it does, `InterviewProfileSnapshot`, `AudienceSnapshot`, and `BusinessModeSnapshot` still have no authoritative input order.

That is the most important blocker in this authority.

### 5. `BusinessModeSnapshot` is named, but not yet grounded in the inventory

This is still one of the largest missing pieces.

The document says `BusinessModeSnapshot` is required, but it does not yet identify where current business-mode-like signals actually live.

In the repo, those signals are fragmented across:

- funnel logic
- content logic
- possibly blueprint logic

If the inventory does not identify those current sources, the later projection contract will be under-specified.

## What Must Be Tightened

### 1. Replace category labels with named file-level inventories

Every source section should move from:

- category
- status unknown

to:

- file path
- authority role
- data class: fact / inference / strategy
- write path or read path
- fallback behavior

That is the level needed for migration.

### 2. Add explicit source precedence mapping

This inventory should contain a section like:

```text
Projection Source Precedence
```

For each target projection:

- primary source
- secondary source
- fallback source
- unresolved conflicts

Without that, this inventory has not yet answered the hardest part of Interview Authority.

### 3. Expand consumer inventory into named runtime consumers

For each consumer group, list:

- route
- hook
- service
- component
- API

And identify whether the consumer currently reads:

- `BrandProfile`
- metadata
- direct interview output
- extracted audience fields
- derived strategy fields

That is what later consumer migration work will need.

### 4. Split factual projection inputs from derived strategy inputs

This is especially important for:

- `InterviewProfileSnapshot`
- `AudienceSnapshot`
- `BusinessModeSnapshot`
- `BusinessContextSnapshot`

The inventory should explicitly separate:

- factual fields already present in runtime
- inferred fields
- downstream strategy outputs

Otherwise V7.1 will quietly mix truth authority with recommendation authority.

### 5. Add a readiness judgment at the end

The document currently has completion criteria, which is good.

But once the inventory is filled in, it should end with an explicit status such as:

- not ready for migration
- ready for projection definition
- ready for consumer migration planning

Right now it cannot support a go/no-go decision.

## Recommended Next Step

Before treating this inventory as complete, fill these gaps in order:

1. file-level source inventory
2. file-level consumer inventory
3. source precedence map
4. fact vs inference vs strategy classification
5. migration readiness judgment

Only then should V7.1 migration planning move forward.

## Final Judgment

This is the right document to create first.

It asks the right questions and it names the right target projections.

But the actual inventory work is still mostly undone.

My final judgment:

`APPROVE AS STRUCTURE, REJECT AS COMPLETED INVENTORY`

It is currently a planning shell for the audit, not the finished audit itself.
