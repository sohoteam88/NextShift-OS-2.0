# Sprint 001 Task 003 - Shared Types Foundation

Version: 1.0

Status: Active

Sprint: Sprint-001 Engineering Foundation

Priority: Critical

Owner: Codex

Reviewer: Claude Code

Approver: Chief Architect

## Purpose

This task defines the shared type foundation for the NextShift OS monorepo.

The Shared Types package provides the common language used across all packages.

It prevents duplicated primitive types and establishes a single engineering vocabulary.

## Mission

The mission of the Shared Types Foundation is to create one canonical set of shared engineering types that every package can depend upon.

The Shared Types package should become the Shared Kernel of the engineering architecture.

## Objectives

Create the shared package for:

- Common identifiers
- Time types
- Result types
- Error types
- Metadata
- Tenant context
- Pagination
- Common interfaces

No business logic should be implemented.

## Package

```text
packages/shared/
```

## Implementation Cycle

- [Implementation Cycle 001 - Shared Package](../engineering/implementation-cycles/IMPLEMENTATION_CYCLE_001_SHARED_PACKAGE.md)

## Required Modules

Create placeholder modules for:

```text
ids/
time/
result/
errors/
events/
metadata/
pagination/
context/
```

## Canonical Identifiers

The shared package should define branded identifier types.

Examples:

- BusinessId
- UserId
- TenantId
- StoryId
- EventId
- DecisionId
- RecommendationId
- AgentId

Packages should never redefine these identifiers.

## Result Type

Provide one canonical Result type.

Purpose:

Standardize success and failure handling across the platform.

## Error Types

Provide common error categories.

Examples:

- ValidationError
- DomainError
- InfrastructureError
- AuthorizationError
- ConfigurationError

Packages may extend but should not replace them.

## Time

Provide shared time abstractions.

Examples:

- Timestamp
- Duration
- DateRange

## Metadata

Provide shared metadata interfaces.

Examples:

- CreatedAt
- UpdatedAt
- Version
- Source
- CorrelationId

## Tenant Context

Support multi-tenant architecture.

Examples:

- TenantId
- WorkspaceId
- OrganizationId

## Engineering Rules

Business packages should depend on shared.

Shared must never depend on business packages.

Shared must remain business-agnostic.

## Deliverables

Create:

- packages/shared
- Empty module structure
- README
- Public exports
- Placeholder index files

No implementation logic.

## Acceptance Criteria

The task is complete when:

- Shared package exists.
- Canonical identifiers are defined.
- No business package defines duplicate primitive types.
- Dependency direction follows architecture.
- Claude Code confirms architecture compliance.

## Out of Scope

Do not implement:

- Business logic
- Business Brain
- Decision logic
- Database models

Only the engineering foundation.

## Next Step

Sprint-001 Task-004

Business Brain Package Bootstrap

Objectives:

- Create package
- Public API
- Package boundaries
- Internal folder structure

No domain logic yet.

## Guiding Principle

Shared engineering language creates shared engineering understanding.

Every package should speak the same language before implementing business behavior.
