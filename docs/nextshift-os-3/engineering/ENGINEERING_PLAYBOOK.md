# Engineering Playbook

Version: 1.2

Status: Approved

Supersedes: Engineering Playbook v1.1

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

## Execution Playbook

The mandatory role-based execution workflow is defined in [NextShift Engineering Execution Playbook v1.0](NEXTSHIFT_ENGINEERING_EXECUTION_PLAYBOOK_v1.0.md).

## Engineering Automation Extension

Engineering automation supports the mandatory delivery lifecycle. It does not replace or redefine it.

The lifecycle remains:

```text
Planning
  -> Implementation
  -> Verification
  -> Audit
  -> Release
```

AG-001 Artifact Generator packages repository Markdown sources into standardized artifact ZIP files. It supports context, execution, audit, release, and deployment evidence packaging.

AG-002 Chat Bootstrap Generator prepares AI handoff packages for Codex, Claude, ChatGPT, or another assistant. It generates the current context package, repository snapshot, bootstrap manifest, and upload checklist.

Use [Engineering Automation](ENGINEERING_AUTOMATION.md) for generator commands, package policies, handoff flow, and Stop A / Stop B / Stop C convenience mapping.

## Engineering Playbook v1.2 Governed Automation Workflow

Engineering Playbook v1.2 promotes the validated Developer Platform automation workflow to:

```text
Governed Engineering Automation Workflow
```

The governance source set is maintained in [Engineering Playbook v1.2](../engineering-playbook-v1.2/README.md).

The governed workflow includes:

- [Automation Governance](../engineering-playbook-v1.2/AUTOMATION_GOVERNANCE.md)
- [AI Workflow Governance](../engineering-playbook-v1.2/AI_WORKFLOW_GOVERNANCE.md)
- [Git Release Policy](../engineering-playbook-v1.2/GIT_RELEASE_POLICY.md)
- [Documentation Validation Policy](../engineering-playbook-v1.2/DOCUMENTATION_VALIDATION_POLICY.md)
- [Navigation Consistency Policy](../engineering-playbook-v1.2/NAVIGATION_CONSISTENCY_POLICY.md)
- [Advisory Registry Policy](../engineering-playbook-v1.2/ADVISORY_REGISTRY_POLICY.md)
- [Project Closure Policy](../engineering-playbook-v1.2/PROJECT_CLOSURE_POLICY.md)
- [Branch Synchronization Policy](../engineering-playbook-v1.2/BRANCH_SYNCHRONIZATION_POLICY.md)

Governed automation is permitted only as lifecycle support. It packages evidence, prepares handoffs, validates documentation, and reports branch state. It does not approve lifecycle state.

Required documentation validation commands:

```bash
pnpm docs:links
pnpm docs:navigation
```

Required release and closure support commands when in scope:

```bash
pnpm project:closure-package
pnpm git:branch-sync
```

Automation rules:

- Use automation to package evidence, not to prove lifecycle completion.
- Keep Engineering Playbook v1.2 as the governed workflow authority.
- Do not create or reintroduce Engineering Orchestrator v1.0.
- Do not commit generated ZIPs or generated files under `artifacts/`.
- Regenerate chat bootstrap packages before cross-chat handoff, audit handoff, long context transfer, or continuation in a fresh AI window.
- Confirm no secrets, local environment files, service keys, or unapproved generated artifacts are included in packages.
- Preserve Git hygiene: stage only scoped source and documentation changes for the current task.
- Do not stage `docs/nextshift-os-3/context-package/` unless the task explicitly authorizes context package updates.
- Run Markdown link and navigation validation when documentation changes are part of implementation, release, or project closure.
- Report branch synchronization after release checkpoint pushes when required.

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
