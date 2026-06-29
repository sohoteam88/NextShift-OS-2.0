# Engineering Playbook

Version: 1.1

Status: Approved

Supersedes: Engineering Playbook v1.0 Delivery Process

## Purpose

This playbook captures the engineering practices that have been validated through real implementation in NextShift OS.

Unlike Engineering Standards, which define mandatory rules, this playbook documents proven implementation patterns, engineering workflows, architectural decisions, and practical guidance.

It evolves as the engineering team gains experience.

## Engineering Philosophy

Architecture provides the foundation.

Runtime enables intelligence.

Capabilities deliver value.

Learning drives evolution.

Every engineering practice should reinforce these principles.

## Playbook Principles

## 1. Build from the Inside Out

Implementation order:

```text
Domain
  -> Contracts
  -> Application
  -> Business Brain
  -> Events
  -> API
  -> UI
```

Do not start from the UI.

Business behavior belongs at the core.

## 2. Vertical Slice Development

A capability is implemented as a sequence of small, production-ready vertical slices.

Every slice should:

- Deliver business value.
- Be independently testable.
- Be independently auditable.
- Be independently mergeable.

## 3. Contract-First Engineering

Application depends on contracts.

Runtime implementations satisfy contracts.

Never allow the Application Layer to depend on concrete runtime implementations.

## 4. Event-Driven Integration

Capabilities communicate through business events.

Events describe completed business facts.

Never use events as commands.

## 5. Business Twin Growth

The Business Twin grows incrementally.

Suggested sequence:

1. Identity
2. Brand DNA
3. Offer
4. Customer
5. Goals
6. AI Summary

Each slice enriches business understanding.

## 6. Capability Lifecycle

Every capability follows:

```text
Capability Definition
  -> Domain Model
  -> Use Cases
  -> Events
  -> Application Specification
  -> Implementation Slice
  -> Slice Audit
  -> Merge
  -> Next Slice
```

After all slices:

```text
Capability Audit
  -> Release
  -> Capability Freeze
```

## 7. Audit Before Merge

No implementation is merged without an independent architecture audit.

Merge policy:

- Critical findings: 0
- High findings: 0
- Blocking Medium findings: 0

Low findings may be deferred with documentation.

## 8. Runtime Stability

Blueprint changes rarely.

Runtime changes carefully.

Capabilities evolve continuously.

Do not modify the runtime unless a capability demonstrates a genuine architectural need.

## 9. Domain First

Canonical business concepts belong in `@nextshift/domain`.

Never redefine business concepts in:

- API
- UI
- Application
- Business Brain
- Contracts

Contracts may define structural payloads but not competing domain models.

## 10. Keep Contracts Independent

`@nextshift/contracts` must remain implementation-independent.

Contracts must not import runtime packages or domain implementations that introduce circular dependencies.

When necessary, use structural payload types.

## 11. Preserve Dependency Inversion

Application depends on contracts.

Business Brain depends on domain.

Concrete implementations remain replaceable.

When in doubt, depend on an interface.

## 12. Grow Capability, Not Complexity

Each slice should introduce one new business concept.

Avoid implementing multiple business concerns in the same slice.

Smaller slices produce better audits and easier rollbacks.

## Engineering Workflow

The standard delivery lifecycle is mandatory for every capability and implementation slice.

```text
Planning
  -> Implementation
  -> Verification
  -> Audit
  -> Release
```

No stage may be skipped.

## Phase 1: Planning

Planning defines intent.

Planning documents never represent completed implementation.

Artifacts include:

- Definition
- Domain Model
- Use Cases
- Events
- Application Specification
- Implementation Slices
- Build Specification
- Implementation Tasks
- Implementation Plan

Allowed status values:

- Draft
- Ready for Review
- Approved
- Ready for Implementation

## Phase 2: Implementation

Implementation begins only when source code changes.

Markdown-only work does not advance implementation status.

Implementation includes:

- Domain layer
- Application layer
- Infrastructure
- Tests
- Typecheck

Completion requirements:

- Source code complete
- Public API updated
- Tests written
- Typecheck passes

## Phase 3: Verification

Verification validates implementation internally.

Artifacts:

- Implementation Report
- Verification Checklist
- Evidence Package

Required evidence:

- Files changed
- Test results
- Typecheck results
- Public API changes
- Known limitations

Verification is performed by the implementation team.

Verification is not an audit.

## Phase 4: Audit

Audit is an independent engineering review.

Audit confirms:

- Specification compliance
- Domain correctness
- Repository correctness
- Application correctness
- Event correctness
- Test completeness
- Documentation completeness

Audit outcomes:

- PASS
- FAIL
- BLOCKED

Audit cannot begin until Verification passes.

## Phase 5: Release

Release follows a successful audit.

Artifacts:

- Release Notes
- Capability Status Update
- MASTER_INDEX update

Release status:

- Draft
- Approved

Draft release notes may exist before audit.

Approval requires Audit PASS.

## Next Phase Rule

`MASTER_INDEX.md` must always reference the earliest incomplete engineering activity.

Example:

```text
Correct:
Next Phase
CAP-002 S-002 Lead Management Implementation

Incorrect:
Next Phase
CAP-002 S-002 Lead Management Audit
```

when implementation has not yet completed.

## Evidence Requirements

Every implementation slice must produce:

- Build Specification
- Implementation Tasks
- Implementation Report
- Verification Checklist
- Audit
- Release Notes

No document may substitute for another.

## Delivery Lifecycle Governance Rules

G-001:

Planning documents define work. They do not prove work.

G-002:

Implementation begins with source code changes.

G-003:

Verification requires implementation evidence.

G-004:

Audit reviews evidence. Audit never reviews planning documents alone.

G-005:

Release requires Audit PASS.

G-006:

Next Phase always points to executable work.

## Adoption

Effective immediately.

Applies to:

- CAP-002 CRM
- All remaining CAP-002 slices
- CAP-003 and later capabilities
- Future Blueprint revisions unless superseded

## Delivery Order Principle

The mandatory order is:

```text
Planning precedes implementation.
Implementation precedes verification.
Verification precedes audit.
Audit precedes release.
```

No stage may be skipped or reordered.

## Common Anti-Patterns

Avoid:

- UI-first development
- Business logic in controllers
- Runtime bypasses
- Concrete implementation dependencies in Application
- Duplicate domain models
- Long-lived feature branches
- Oversized implementation slices

## Proven Practices

Validated during CAP-001:

- `BusinessBrainContract` instead of concrete `BusinessBrain`.
- Structural payloads in contracts.
- In-memory bootstrap stores before persistence.
- Event publication through Event Bus only.
- Canonical domain models.
- Slice-by-slice Business Twin enrichment.

The detailed CAP-001 evidence is recorded in [Lessons Learned CAP-001](../capabilities/LESSONS_LEARNED_CAP_001.md).

These practices should be reused unless a future RFC replaces them.

## Repository Evolution

The repository evolves in three layers:

```text
Blueprint
  -> Core Runtime
  -> Business Capabilities
```

Engineering should protect the lower layers while accelerating delivery in the upper layers.

## Living Knowledge

This playbook is intentionally evolutionary.

Every significant implementation, audit, or architectural lesson should be evaluated for inclusion.

Only proven practices belong here.

## Guiding Principle

Good architecture is designed.

Great engineering is repeatedly practiced.

The playbook exists to capture those practices so they become the team's default way of building NextShift OS.
