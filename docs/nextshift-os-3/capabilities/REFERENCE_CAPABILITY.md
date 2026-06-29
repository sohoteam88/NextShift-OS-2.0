## REFERENCE_CAPABILITY

Version: 1.0

Status: Approved

Reference Capability: CAP-001 Business Profile

---

## Purpose

This document defines why CAP-001 Business Profile is the reference capability for NextShift OS.

A reference capability demonstrates the expected architecture, engineering practices, implementation workflow, and governance model for future capabilities.

Future capabilities should reuse these proven patterns rather than inventing new ones.

---

## Why CAP-001

CAP-001 is the first capability to complete the full engineering lifecycle.

It has demonstrated:

- Capability Definition
- Domain Modeling
- Use Case Design
- Event Modeling
- Application Specification
- Vertical Slice Implementation
- Independent Architecture Audits
- Release Governance

It therefore becomes the canonical implementation example.

---

## Reference Architecture

Every capability should follow the same architecture:

```text
UI
    |
    v
API
    |
    v
Application
    |
    v
Business Brain
    |
    v
Business Twin
    |
    v
Event Bus
```

No layer should be bypassed.

---

## Runtime Pattern

Future capabilities should use:

- `@nextshift/domain`
- `@nextshift/contracts`
- `@nextshift/event-bus`
- `@nextshift/business-brain`
- `@nextshift/application`

Additional runtime packages may be consumed only when the capability genuinely requires them.

---

## Dependency Rules

Application depends on contracts.

Business Brain depends on domain.

Contracts remain implementation-independent.

No capability should introduce circular dependencies.

---

## Canonical Modeling

Every business concept has one canonical model.

Canonical models belong in:

```text
@nextshift/domain
```

Contracts expose structural payloads.

No competing domain models should be introduced.

---

## Capability Lifecycle

Every capability should follow this lifecycle:

```text
Definition
        |
        v
Domain Model
        |
        v
Use Cases
        |
        v
Events
        |
        v
Application Specification
        |
        v
Implementation Slices
        |
        v
Slice Audit
        |
        v
Release
        |
        v
Reference
        |
        v
Retrospective
```

No stages should be skipped.

---

## Vertical Slice Pattern

Each capability should be implemented through small vertical slices.

Every slice should:

- Deliver business value.
- Compile successfully.
- Pass typecheck.
- Pass an independent architecture audit.
- Be mergeable on its own.

Avoid large feature branches.

---

## Audit Requirements

Every slice must satisfy:

- Critical findings = 0
- High findings = 0
- Blocking Medium findings = 0

Low findings may be documented and scheduled.

No slice should merge without an independent audit.

---

## Engineering Patterns

The following patterns are considered validated:

- Contract-first Application Layer
- Canonical domain models
- Structural payloads in contracts
- Event-driven integration
- Deterministic business logic
- In-memory bootstrap implementations
- Business Brain ownership of business understanding

Future capabilities should reuse these patterns unless superseded by an approved architectural decision.

---

## Capability Boundaries

A capability owns its business concept.

It should not duplicate concepts owned by another capability.

Example:

- Business Identity belongs to CAP-001.
- CRM should consume Business Identity rather than redefining it.
- Campaign should consume Customer Intelligence rather than maintaining a separate customer model.

---

## Business Twin Integration

Future capabilities should extend the Business Twin rather than replacing it.

The Business Twin is the authoritative business context shared across the platform.

Capabilities contribute new context.

They do not redefine existing context.

---

## Governance

Every capability should produce:

- Capability Definition
- Implementation Cycle
- Slice Specifications
- Slice Audit Reports
- Capability Release
- Capability Retrospective
- Lessons Learned

These artifacts provide traceability and long-term maintainability.

---

## Engineering Checklist

Before starting a new capability:

- Read this document.
- Review CAP-001.
- Reuse existing runtime patterns.
- Reuse engineering standards.
- Reuse engineering playbook.

Avoid creating capability-specific architecture unless justified.

---

## Future Capabilities

The following capabilities should treat CAP-001 as the implementation reference:

- CAP-002 CRM
- CAP-003 Content
- CAP-004 Campaign
- CAP-005 Revenue
- CAP-006 Analytics
- CAP-007 AI Coach

Future capabilities may extend the architecture but should not weaken established engineering patterns.

---

## Success Criteria

A capability is considered reference-quality when:

- It follows the Blueprint.
- It respects runtime boundaries.
- It delivers business value.
- It passes independent architecture audits.
- It is reusable as an implementation example.

CAP-001 satisfies these criteria.

---

## Guiding Principle

Reference capabilities establish engineering patterns.

Future capabilities should inherit those patterns rather than redesigning them.
