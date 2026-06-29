# Sprint 001 Task 001 - Project Skeleton

Version: 1.0

Status: Active

Sprint: Sprint-001 Engineering Foundation

Priority: Critical

Owner: Codex

Reviewer: Claude Code

Approver: Chief Architect

## Purpose

This task defines the engineering skeleton of the NextShift OS repository.

The Project Skeleton transforms the approved Blueprint into a production-ready repository structure.

This task creates the architectural foundation upon which all future implementation will be built.

## Mission

The mission of the Project Skeleton is to ensure that the repository structure mirrors the approved architecture.

Repository structure is architecture expressed as folders.

Every package should have a clear architectural responsibility.

## Objectives

Sprint-001 Task-001 should:

- Create the monorepo structure.
- Define package boundaries.
- Define application boundaries.
- Define dependency boundaries.
- Prepare the repository for implementation.

No business logic should be implemented during this task.

## Repository Structure

```text
nextshift-os/
  apps/
    web/
    admin/
    worker/
    docs/
  packages/
    business-brain/
    decision-brain/
    execution-layer/
    learning-system/
    event-bus/
    shared/
    contracts/
    sdk/
    ui/
  infrastructure/
    database/
    messaging/
    storage/
    monitoring/
    deployment/
  tools/
  tests/
  docs/
  scripts/
```

## Package Responsibilities

### business-brain

Owns:

- Business Twin
- Business Memory
- Story Vault
- Knowledge Graph

### decision-brain

Owns:

- Recommendation Engine
- Strategy Engine
- Opportunity Engine
- Risk Engine
- Prioritization Engine

### execution-layer

Owns execution orchestration.

Does not own business knowledge.

### learning-system

Owns:

- Reflection
- Learning
- Optimization
- AI Coach

### event-bus

Owns:

- Event publishing
- Event subscription
- Event routing

### shared

Owns:

- Shared types
- Utilities
- Constants
- Common interfaces

### contracts

Owns implementation contracts shared across packages.

### sdk

Owns external SDKs.

### ui

Owns reusable UI components.

## Dependency Rules

Allowed:

```text
Business Brain
  -> Decision Brain
  -> Execution Layer
  -> Learning System
  -> Business Brain
```

Learning System returns to Business Brain through event-driven feedback.

Forbidden:

```text
Execution Layer
  -> Business Brain
```

Direct dependency is forbidden.

```text
Decision Brain
  -> Database
```

Direct dependency is forbidden.

```text
Agents
  -> Business Memory
```

Direct access is forbidden.

Agents must access Business Brain only.

## Engineering Rules

Every package:

- Has one responsibility.
- Has one owner.
- Has independent tests.
- Has independent documentation.

## Deliverables

Create:

- Repository folders
- Empty packages
- README for every package
- Placeholder index files

Do not implement business logic.

## Acceptance Criteria

Sprint-001 Task-001 is complete when:

- Repository structure matches the Blueprint.
- Package boundaries are established.
- Dependency rules are documented.
- Empty package scaffolding exists.
- Claude Code confirms architecture compliance.

## Out of Scope

Do not implement:

- Business Twin
- Recommendation Engine
- Database
- APIs
- Authentication
- UI logic

This sprint builds the engineering foundation only.

## Next Step

[Sprint-001 Task-002](SPRINT-001_TASK-002_MONOREPO_CONFIGURATION.md)

Monorepo Configuration

- pnpm workspace
- TypeScript project references
- Shared build pipeline
- Package naming
- Development tooling

## Guiding Principle

A stable repository structure enables stable software architecture.

Project structure should reflect architectural responsibility rather than technical convenience.
