# Naming Conventions

Version: 1.0

Status: Approved

Canonical: Yes

## Purpose

This document defines the official naming conventions for the NextShift OS repository.

Consistent naming improves architecture clarity, documentation quality, AI reasoning, and engineering productivity.

All documentation, source code, APIs, events, and specifications should follow these conventions.

## Core Principle

One concept.

One name.

One responsibility.

Every architectural concept should have one official name.

Alternative names should not be introduced.

## Architectural Naming

### Brain

Use Brain only for systems responsible for cognition.

Approved names:

- Business Brain
- Decision Brain

Do not use:

- Business Intelligence Engine
- Decision Layer
- Brain Engine

### System

Use System for long-running platform responsibilities.

Approved names:

- Learning System

Do not use:

- Learning Layer
- Learning Platform
- Learning Module

### Layer

Use Layer only for architectural layers.

Approved names:

- Execution Layer
- Capability Layer

Do not use:

- Business Brain Layer
- Learning Layer

### Architecture

Use Architecture only for top-level architectural documents.

Examples:

- BUSINESS_BRAIN_ARCHITECTURE.md
- EVENT_ARCHITECTURE.md
- DOMAIN_ARCHITECTURE.md

### Contract

Use Contract only for implementation-independent obligations.

Examples:

- BUSINESS_TWIN_CONTRACT.md
- DECISION_BRAIN_CONTRACT.md

Contracts define guarantees.

They do not describe implementation.

### Specification

Use Specification only for implementation details.

Examples:

- BUSINESS_TWIN_SPECIFICATION.md
- EVENT_SPECIFICATION.md

Specifications describe how to implement contracts.

### Interface

Use Interface only for communication boundaries.

Examples:

- AGENT_PROTOCOL.md
- EVENT_SCHEMA.md
- API_SPECIFICATION.md

## Canonical Architectural Names

The following names are canonical.

### Core Systems

- Business Brain
- Decision Brain
- Execution Layer
- Learning System

### Core Knowledge

- Business Twin
- Business Memory
- Story Vault
- Knowledge Graph

### Core Intelligence

- Business Intelligence
- Decision Intelligence

### Core Components

- Recommendation Engine
- Strategy Engine
- Opportunity Engine
- Risk Engine
- Prioritization Engine
- Conversation Engine

## File Naming

Architecture documents:

```text
*_ARCHITECTURE.md
```

Contracts:

```text
*_CONTRACT.md
```

Specifications:

```text
*_SPECIFICATION.md
```

Interfaces:

```text
*_PROTOCOL.md
*_SCHEMA.md
*_API.md
```

Governance:

```text
UPPERCASE_NAME.md
```

Examples:

- GOVERNANCE.md
- MASTER_INDEX.md
- SYSTEM_CONTEXT.md

## Folder Naming

Use numeric prefixes for top-level architectural layers.

Example:

```text
00-governance
01-foundation
02-constitution
03-reference
04-architecture
05-contracts
06-specifications
07-interfaces
08-implementation
09-playbooks
10-engineering
```

## Event Naming

Events should use past tense.

Examples:

- DecisionApproved
- CampaignLaunched
- BusinessTwinUpdated
- LearningRecorded
- RecommendationGenerated

Avoid imperative names such as:

- UpdateBusinessTwin
- LaunchCampaign

Events describe facts.

They do not issue commands.

## API Naming

APIs should describe business capabilities.

Prefer:

- CreateRecommendation
- RetrieveBusinessContext
- RecordLearning

Avoid:

- DoTask
- ProcessThing
- ExecuteMagic

## AI Agent Naming

Agent names should describe business responsibility.

Examples:

- Strategy Agent
- Marketing Agent
- Finance Agent
- Operations Agent
- AI Coach

Avoid naming agents after implementation details.

## Repository Rule

Every new concept must reuse existing canonical names whenever possible.

If a new canonical concept is required, it must be approved through the RFC process.

## Success Criteria

The naming convention is successful when:

- Every architectural concept has one official name.
- AI contributors do not invent alternative terminology.
- Documentation remains consistent.
- Searchability improves.
- Repository maintenance becomes easier.

## Guiding Principle

Architecture becomes easier to understand when language becomes consistent.

Consistent language creates consistent thinking.
