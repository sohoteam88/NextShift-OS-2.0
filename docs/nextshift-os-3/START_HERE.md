# Start Here

Version: 1.0

Status: Approved

## Welcome to NextShift OS 3.0

If you are reading this document, you are about to contribute to the architecture, implementation, or evolution of NextShift OS.

Before writing code, modifying documentation, or proposing architectural changes, spend a few minutes understanding how this repository is organized.

The quality of the implementation depends on the quality of understanding.

## What is NextShift?

NextShift is an AI Guided Business Operating System.

It is designed to help entrepreneurs:

- Understand their business.
- Make better decisions.
- Execute with confidence.
- Learn continuously.

NextShift is not a collection of business tools.

It is a cognitive operating system for business.

## Before You Do Anything

Do not start with source code.

Do not start with the database.

Do not start with APIs.

Start by understanding the architecture.

Architecture is the product.

Implementation is one expression of that architecture.

## Read in This Order

### 0. Blueprint

Understand the current platform vision, runtime status, reference capability, and roadmap.

- [NextShift OS 3.0 Blueprint](NEXTSHIFT_OS_3_BLUEPRINT.md)

### 1. System Context

Understand the purpose of the repository.

- [System Context](SYSTEM_CONTEXT.md)

### 2. Master Index

Understand how the repository is organized.

- [Master Index](MASTER_INDEX.md)

### 3. Governance

Understand how architectural decisions are made.

- [Governance](governance/GOVERNANCE.md)

### 4. Foundation

Understand how NextShift understands businesses.

- [Phase 0 Foundation](phase-0-foundation/README.md)

### 5. Constitution

Understand the permanent principles of the platform.

- [Current Constitution](constitution/README.md)

### 6. Reference Architecture

Understand how the operating system is organized.

- [NextShift Reference Architecture](phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md)

### 7. Architecture

Understand each major subsystem.

- [Phase 2 Architecture](phase-2-architecture/README.md)

### 8. Contracts

Understand implementation obligations.

- [Business Brain Contract](phase-2-architecture/BUSINESS_BRAIN_CONTRACT.md)
- [Decision Brain Contract](phase-2-architecture/DECISION_BRAIN_CONTRACT.md)
- [Execution Layer Contract](phase-2-architecture/EXECUTION_LAYER_CONTRACT.md)
- [Learning System Contract](phase-2-architecture/LEARNING_SYSTEM_CONTRACT.md)

### 9. Specifications

Understand implementation details.

Status: Planned.

### 10. Source Code

Only after understanding everything above.

## Remember the Four Cognitive Systems

Every feature belongs somewhere within these systems.

```text
Business Brain
  -> Decision Brain
  -> Execution Layer
  -> Learning System
```

If a feature does not strengthen one of these systems, reconsider why it exists.

## Repository Philosophy

The repository evolves from ideas to software.

```text
Governance
  -> Foundation
  -> Constitution
  -> Reference
  -> Architecture
  -> Contracts
  -> Specifications
  -> Interfaces
  -> Implementation
  -> Source Code
```

Never reverse this order.

## Before Making Changes

Ask yourself:

- Do I understand the Business Twin?
- Do I understand the Cognitive Architecture?
- Does this change improve business understanding?
- Does this improve decision quality?
- Does this strengthen long-term architecture?
- Does this require an RFC?

If you cannot confidently answer these questions, continue reading before making changes.

## Engineering Philosophy

Architecture drives implementation.

Implementation validates architecture.

Learning improves both.

This is the engineering philosophy of NextShift OS.

## Success

You are ready to contribute when you understand:

- Why NextShift exists.
- How the Business Twin works.
- Why Business Brain and Decision Brain are separate.
- Why execution follows decisions.
- Why learning completes the cognitive loop.

Only then should implementation begin.

## Final Reminder

Every line of code should strengthen the architecture.

Every architectural improvement should make future implementation easier.

Every learning should improve both.

Welcome to NextShift OS.
