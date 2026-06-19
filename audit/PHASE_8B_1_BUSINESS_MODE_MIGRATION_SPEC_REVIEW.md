# PHASE 8B.1 Business Mode Migration Spec Review

## Verdict

`APPROVE AS SPEC SCOPE, REJECT AS MIGRATION-READY SPEC`

This document is pointing at the right decisions, but it has not made them yet. It is still a checklist of unresolved items, not an executable migration specification.

## What It Gets Right

### 1. It targets the correct unresolved gap

The previous review on `PHASE_8B` identified three missing areas:

1. taxonomy mismatch
2. undefined legacy-source collapse
3. no canonical write path

This document explicitly targets those three gaps. That is the right next step.

### 2. It uses the right decision buckets

The categories are correct:

- taxonomy
- persistence
- write authority
- read authority
- legacy collapse rules
- consumer migration

That matches the actual blockers proven by the Business Mode audits.

## Why It Is Not Migration-Ready Yet

### 1. Taxonomy is still undecided

The document correctly frames the mismatch:

- current runtime: `retail / recruitment / upgrade`
- proposed: `retail / recruitment / hybrid`

But it does not actually decide:

- keep `upgrade`
- replace `upgrade`
- map `upgrade` to `hybrid`

Without that decision, downstream consumer migration is ambiguous.

### 2. Canonical persistence is still undecided

The document asks where `BusinessModeSnapshot` should live, but it does not choose:

- InterviewProfile
- BusinessModeSnapshot
- BrandProfile
- dedicated table

Until that is fixed, there is still no actual canonical persistence layer.

### 3. Write authority is still undefined

The document asks:

- who may create mode
- who may edit mode
- who may not edit mode

But it does not answer them. So current runtime still has no enforceable write authority.

### 4. Read authority is still undefined

The document says all consumers must migrate to one read path, but it does not define the path itself.
That means the central runtime question remains open:

`What single function or projection do all consumers read?`

### 5. Legacy collapse rules are still placeholders

The document lists:

- localStorage
- query param
- defaults
- heuristics

But it still does not define:

- actual primary legacy fallback
- actual secondary fallback
- retirement order

That is the core of the current BusinessMode authority problem, so leaving it unresolved means the spec is not complete.

## Readiness Assessment

Based on current repo evidence and the previous `PHASE_8B` review:

- architecture direction: `READY`
- migration-spec structure: `READY`
- migration-spec completion: `NOT READY`

## What Must Exist Before This Becomes Migration-Ready

This document becomes migration-ready only after it explicitly decides:

1. final taxonomy
2. canonical persistence layer
3. single write authority
4. single read authority
5. exact legacy collapse order

Right now it asks for those answers, but it does not contain them.

## Final Review Decision

`APPROVE AS SPEC SCOPE, REJECT AS MIGRATION-READY SPEC`

This is the correct template for the next document, but it is not yet the migration spec itself.
