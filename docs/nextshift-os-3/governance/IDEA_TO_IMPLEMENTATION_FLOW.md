# Idea to Implementation Flow

This document defines the governance flow for turning a NextShift OS 3.0 idea into approved architecture and implementation.

## Flow

```text
Idea
  -> RFC
  -> Architecture Review
  -> Approved
  -> Constitution
  -> Implementation
```

## Purpose

Every meaningful architecture or product change should move through an explicit decision path before implementation.

The goal is to preserve architectural clarity:

- Ideas begin as proposals.
- RFCs preserve decision history.
- Architecture Review validates alignment.
- Approved RFCs update the current Constitution.
- Implementation follows the approved Constitution.

## Directory Model

```text
docs/
  nextshift-os-3/
    constitution/
    governance/
    rfc/
      README.md
      RFC-0001-First-Principles.md
      RFC-0002-Business-Ontology.md
      RFC-0003-AI-Operating-Loop.md
      RFC-0004-Business-Twin.md
      RFC-0005-Architecture-Principles.md
      RFC-0006-AI-Reasoning-Model.md
      TEMPLATE.md
    phase-0-foundation/
    phase-1-constitution/
    phase-2-architecture/
    phase-3-implementation/
```

## Core Rule

RFCs permanently preserve history.

The Constitution only keeps the currently effective version.

This means older proposals, rejected alternatives, and superseded decisions remain visible in `rfc/`, while current operating rules live in the relevant Constitution or phase directory.

## Approval Path

1. Draft the idea as an RFC.
2. Review the RFC against Phase 0 Foundation.
3. Resolve architectural questions and trade-offs.
4. Approve, reject, or supersede the RFC.
5. If approved, update the current Constitution or phase document.
6. Implement only against the approved current document.

## Review Requirements

An RFC should not be approved unless it:

- Aligns with First Principles.
- Strengthens the Business Twin.
- Supports the AI Operating Loop.
- Improves long-term architecture.
- Avoids conflicting business truth.
- Keeps decision making before execution.
- Produces learning after execution.
