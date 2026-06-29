# Sprint 001 Task 002 - Monorepo Configuration

Version: 1.0

Status: Active

Sprint: Sprint-001 Engineering Foundation

Priority: Critical

Owner: Codex

Reviewer: Claude Code

Approver: Chief Architect

## Purpose

This task defines the monorepo configuration for NextShift OS.

The monorepo configuration provides the shared engineering foundation for all applications, packages, engines, contracts, interfaces, and future capabilities.

This task prepares the repository for scalable implementation.

## Mission

The mission of this task is to establish a predictable, type-safe, maintainable monorepo that mirrors the approved NextShift architecture.

The monorepo should support independent packages while preserving architectural boundaries.

## Objectives

Sprint-001 Task-002 should establish:

- Workspace configuration
- Package management
- TypeScript configuration
- Build pipeline
- Linting
- Formatting
- Testing bootstrap
- Development scripts
- Package naming conventions

No business logic should be implemented during this task.

## Recommended Stack

### Package Manager

Use:

```text
pnpm
```

Reason:

- Fast workspace support
- Strict dependency isolation
- Good monorepo ergonomics

### Language

Use:

```text
TypeScript
```

Reason:

- Strong typing
- Shared contracts
- AI-friendly code generation
- Clear package boundaries

### Build System

Use:

```text
Turborepo
```

Reason:

- Task orchestration
- Incremental builds
- Cacheable workflows
- Monorepo scalability

## Required Root Files

Create or update:

```text
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
.eslintrc.json
.prettierrc
.gitignore
README.md
```

## Workspace Layout

The workspace should include:

```text
apps/*
packages/*
infrastructure/*
tools/*
```

## Package Naming Convention

Use scoped package names.

```text
@nextshift/business-brain
@nextshift/decision-brain
@nextshift/execution-layer
@nextshift/learning-system
@nextshift/event-bus
@nextshift/shared
@nextshift/contracts
@nextshift/sdk
@nextshift/ui
```

## Root package.json Requirements

The root package should include scripts for:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "test": "turbo run test",
    "audit:architecture": "echo \"Architecture audit is handled by Claude Code\""
  }
}
```

## pnpm Workspace

The workspace should include:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "infrastructure/*"
  - "tools/*"
```

## TypeScript Configuration

Create a shared base config:

```text
tsconfig.base.json
```

Required principles:

- Strict mode enabled
- No implicit any
- No unchecked indexed access where practical
- Consistent module resolution
- Shared path aliases only when necessary

## Package TypeScript Config

Each package should include:

```text
tsconfig.json
```

Each package should extend:

```text
../../tsconfig.base.json
```

## Package Scripts

Every package should support:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "echo \"No tests yet\""
  }
}
```

## Source Layout Per Package

Every package should follow:

```text
package-name/
  src/
    index.ts
  README.md
  package.json
  tsconfig.json
```

## Dependency Rules

Packages may depend only according to architecture.

Allowed examples:

```text
@nextshift/decision-brain -> @nextshift/business-brain
@nextshift/execution-layer -> @nextshift/contracts
@nextshift/learning-system -> @nextshift/event-bus
@nextshift/business-brain -> @nextshift/shared
```

Forbidden examples:

```text
@nextshift/decision-brain -> infrastructure/database
@nextshift/agents -> @nextshift/business-memory directly
@nextshift/ui -> internal engine implementation details
```

## Linting Rules

Linting should enforce:

- No unused variables
- No implicit any
- No circular dependencies where possible
- No direct cross-layer imports that violate architecture
- Consistent import ordering where practical

## Formatting Rules

Use Prettier for formatting.

Formatting should be automatic and not debated in review.

## Testing Bootstrap

Testing may initially be minimal.

However, the structure must support:

- Unit tests
- Contract tests
- Integration tests
- Architecture compliance tests

Future test files may use:

```text
*.test.ts
*.spec.ts
```

## CI Readiness

Even if CI is not configured yet, the monorepo must support:

```text
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

These commands should become the baseline for future CI.

## Out of Scope

Do not implement:

- Business Brain logic
- Decision Brain logic
- Database schema
- API routes
- Authentication
- UI features
- Production workflows

This task is engineering configuration only.

## Deliverables

Codex should create:

- Root workspace configuration
- Base TypeScript configuration
- Package package.json files
- Package tsconfig files
- Empty src/index.ts files
- README files for each package
- Basic lint and format configuration

## Acceptance Criteria

This task is complete when:

- pnpm install works.
- pnpm build works or reaches only expected placeholder limitations.
- pnpm typecheck works.
- pnpm lint works or is configured with documented placeholder limitations.
- Package names follow canonical naming.
- No business logic is implemented.
- Claude Code confirms the monorepo respects architectural boundaries.

## Review Checklist

Claude Code should verify:

- Workspace layout matches Sprint-001 Task-001.
- Package names match Naming Conventions.
- No package violates dependency rules.
- TypeScript strictness is enabled.
- No business logic was introduced.
- Documentation exists for each package.

## Next Step

[Sprint-001 Task-003](SPRINT-001_TASK-003_SHARED_TYPES_FOUNDATION.md)

Shared Types Foundation

Objectives:

- Define shared primitive types.
- Define branded IDs.
- Define result types.
- Define event metadata types.
- Define common timestamp and tenant context types.

## Guiding Principle

A good monorepo makes architecture executable.

The repository should make the correct architecture easy and the wrong architecture difficult.
