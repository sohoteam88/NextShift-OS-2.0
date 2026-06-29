# Lessons Learned CAP-001

Version: 1.0

Status: Living Document

Capability: CAP-001 Business Profile

Period Covered:

- Slice-001 Business Identity
- Slice-002 Brand DNA
- Slice-003 Offer Profile
- Slice-004 Customer Intelligence

## Purpose

This document captures engineering lessons that have been validated during the implementation of CAP-001.

Only lessons confirmed through implementation, audit, or refactoring should be recorded here.

Ideas and hypotheses belong elsewhere.

This document records proven engineering knowledge.

## Lesson 001 - Vertical Slice Development Works

Observation:

Implementing Business Profile as small vertical slices produced stable architecture and manageable reviews.

Evidence:

Slices 001-004 were independently:

- Implemented
- Typechecked
- Audited
- Merged

without destabilizing the runtime.

Decision:

Continue using Vertical Slice Development for all future capabilities.

## Lesson 002 - Contract-First Prevents Coupling

Observation:

The initial implementation coupled the Application Layer to the concrete `BusinessBrain`.

Independent audit detected the issue before merge.

Refactoring to `BusinessBrainContract` restored dependency inversion.

Decision:

Application Layer should always depend on contracts.

Never on runtime implementations.

## Lesson 003 - Runtime First Reduced Rework

Observation:

The Core Runtime was completed before Business Profile implementation.

Result:

Capability development required almost no runtime redesign.

Decision:

Complete runtime foundations before implementing new capabilities.

## Lesson 004 - Business Twin Should Grow Incrementally

Observation:

Business understanding naturally evolved through slices:

1. Identity
2. Brand DNA
3. Offer
4. Customer

Each slice enriched the Business Twin without requiring redesign.

Decision:

Future Business Twin expansion should remain incremental.

## Lesson 005 - Event-Driven Integration Scales Well

Observation:

Each slice communicated through domain events:

- `BusinessProfileCreated`
- `BrandProfileUpdated`
- `OfferProfileUpdated`
- `CustomerProfileUpdated`

No direct coupling between runtime components was introduced.

Decision:

Continue treating events as completed business facts.

## Lesson 006 - Independent Architecture Audit Prevents Design Debt

Observation:

Independent Claude Code audits consistently detected architectural issues before merge.

Most notable:

Application depending on concrete `BusinessBrain`.

This was corrected before becoming long-term technical debt.

Decision:

No capability slice should merge without an independent architecture audit.

## Lesson 007 - Small Cleanup Prevents Long-Term Drift

Observation:

Minor cleanup tasks such as dead code removal and dependency cleanup were inexpensive immediately after implementation.

Deferred cleanup tends to accumulate.

Decision:

Perform targeted cleanup regularly between slices.

Avoid large cleanup phases.

## Lesson 008 - Canonical Domain Models Reduce Duplication

Observation:

Identity, Brand, Offer, and Customer each have one canonical model in `@nextshift/domain`.

Contracts use structural payloads without redefining business concepts.

Decision:

Continue enforcing one canonical domain model per business concept.

## Lesson 009 - Audit Findings Should Be Risk-Based

Observation:

Not all audit findings deserve equal treatment.

Blocking architectural issues were fixed immediately.

Low-risk improvements were documented and deferred.

Decision:

Treat findings according to risk:

- Critical: Block merge
- High: Block merge
- Blocking Medium: Resolve before merge
- Low: Document and schedule

## Lesson 010 - Architecture Should Stay One Slice Ahead

Observation:

Designing one slice ahead allowed architecture to evolve with implementation.

Writing many future slices in advance would likely have required repeated redesign.

Decision:

Maintain a planning horizon of:

- Current Slice
- Next Slice

Avoid large speculative design efforts.

## Engineering Practices Confirmed

The following practices are now considered validated:

- Vertical Slice Development
- Contract-First Application Layer
- Business Twin incremental growth
- Event-Driven capability integration
- Independent architecture audit
- Capability-specific audits
- Small cleanup between slices
- Canonical domain models
- Runtime stability before capability growth

## Practices to Reuse

Future capabilities should follow the same implementation rhythm:

```text
Specification
  -> Implementation
  -> Typecheck
  -> Independent Audit
  -> Patch, if needed
  -> Focused Re-Audit
  -> Merge
  -> Cleanup
  -> Next Slice
```

## CAP-001 Progress

Completed:

- Slice-001 Business Identity
- Slice-002 Brand DNA
- Slice-003 Offer Profile
- Slice-004 Customer Intelligence

Remaining:

- Slice-005 Business Goals
- Slice-006 AI Business Summary
- Slice-007 Business Twin Ready

## Future Updates

Only add lessons that have been demonstrated in practice.

Do not record speculative ideas.

Engineering knowledge should be earned through implementation.

## Guiding Principle

Experience becomes engineering knowledge only after it has been validated.

This playbook records what NextShift has proven, not what it merely believes.
