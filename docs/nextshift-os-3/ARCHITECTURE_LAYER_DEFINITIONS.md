# Architecture Layer Definitions

Version: 1.0

Status: Approved

Canonical: Yes

## Purpose

This document defines the architectural layers of the NextShift OS repository.

Each document must belong to exactly one architectural layer.

Architectural layers define responsibility boundaries.

Folder names should reflect these responsibilities.

## Core Principle

Architecture is organized by responsibility.

Not by implementation.

Not by document type.

Not by development phase.

Every document should answer one primary question.

## Layer Hierarchy

```text
00 Governance
  -> 01 Foundation
  -> 02 Constitution
  -> 03 Reference
  -> 04 Architecture
  -> 05 Contracts
  -> 06 Specifications
  -> 07 Interfaces
  -> 08 Implementation
  -> 09 Playbooks
  -> 10 Engineering
```

Higher layers define lower layers.

Lower layers implement higher layers.

Lower layers must never redefine higher layers.

## 00 Governance

Purpose:

Defines how the repository evolves.

Primary question:

How do we govern NextShift?

Examples:

- Governance
- AI Charter
- AI Contributing
- RFC Process
- Architecture Review
- Audit Process
- Documentation Standards

## 01 Foundation

Purpose:

Defines how NextShift understands the world.

Primary question:

How does reality work?

Foundation documents describe concepts that should remain true regardless of implementation.

Examples:

- First Principles
- Business Ontology
- AI Operating Loop
- Business Twin Definition
- AI Reasoning Model
- Architecture Principles

Foundation defines universal truths.

## 02 Constitution

Purpose:

Defines how NextShift chooses to operate.

Primary question:

How should NextShift behave?

Examples:

- Product Philosophy
- AI Principles
- Business Intelligence Model
- Decision Intelligence Model
- UX Principles
- Engineering Principles

Constitution defines permanent product rules.

## 03 Reference

Purpose:

Provides a complete view of the operating system.

Primary question:

How is the platform organized?

Examples:

- Reference Architecture
- Cognitive Architecture
- Architectural Manifesto

Reference documents connect the entire platform.

## 04 Architecture

Purpose:

Defines major architectural systems.

Primary question:

How is each system organized?

Examples:

- Business Brain
- Decision Brain
- Execution Layer
- Learning System
- Agent Architecture
- Event Architecture
- Domain Architecture

Architecture defines responsibilities.

## 05 Contracts

Purpose:

Defines implementation-independent obligations.

Primary question:

What must every implementation guarantee?

Examples:

- Business Brain Contract
- Business Twin Contract
- Learning System Contract

Contracts define architectural guarantees.

## 06 Specifications

Purpose:

Defines implementation requirements.

Primary question:

How should this component be implemented?

Examples:

- Business Twin Specification
- Event Specification
- Recommendation Engine Specification

Specifications define implementation details.

## 07 Interfaces

Purpose:

Defines communication between systems.

Primary question:

How do systems interact?

Examples:

- API Specifications
- Event Schemas
- Agent Protocols
- Service Contracts

Interfaces define communication.

## 08 Implementation

Purpose:

Maps architecture into production software.

Primary question:

How is this implemented?

Examples:

- Project Structure
- Source Code
- Infrastructure
- Deployment

Implementation produces running software.

## 09 Playbooks

Purpose:

Defines repeatable engineering workflows.

Primary question:

How do we perform common engineering tasks?

Examples:

- Build New Agent
- Add New Capability
- Create RFC
- Refactor Architecture

Playbooks define repeatable processes.

## 10 Engineering

Purpose:

Defines engineering practices.

Primary question:

How do we build software consistently?

Examples:

- Coding Standards
- Testing Strategy
- Project Structure
- Naming Standards

Engineering defines development practices.

## Classification Rules

Every document must satisfy:

- One primary responsibility.
- One architectural layer.
- One canonical location.

Documents should not belong to multiple layers.

## Layer Validation

Before creating a new document, determine:

1. What question does this document answer?
2. Which layer owns that question?
3. Does a similar document already exist?
4. Does the document redefine a higher layer?

If any answer is unclear, reconsider the document before creating it.

## Repository Rule

Layer definitions are canonical.

Folder structure should always reflect architectural responsibility.

Repository organization should evolve only through approved architectural review.

## Guiding Principle

Well-defined architectural layers create well-defined architectural thinking.

Clear boundaries today prevent architectural drift tomorrow.
