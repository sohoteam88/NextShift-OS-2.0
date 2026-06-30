# ARC-003 Engine Context Refactor

Version: 1.0  
Status: Released — OS 3.1 Runtime Baseline  
Architecture Track: NextShift OS 3.1  
Depends On: ARC-001, ARC-002

## 1. Purpose

ARC-003 refactors the shared engine layer so every business engine can consistently consume Workspace Context without duplicating engines, modules, pages, or business logic.

ARC-001 established the Platform Kernel and Member-Centric Identity foundation. ARC-002 established Workspace Context Architecture, Workspace Repository, Workspace Registry, and Workspace Manifest support.

ARC-003 moves Workspace Context from infrastructure readiness into engine-level execution.

## 2. Mission

Transform the shared engine layer into a fully Workspace-aware execution layer while preserving the core NextShift OS 3.1 architecture principle:

**One Platform. One AI Brain. One Business Memory. One Engine Layer. Multiple Workspace Configurations.**

## 3. Primary Objectives

ARC-003 must:

1. Standardize Workspace Context injection across all shared engines.
2. Remove or isolate legacy `track` / `businessMode` branching from engine internals.
3. Keep Retail and Recruitment behavior configuration-driven.
4. Preserve backward compatibility with legacy Single Business Flow.
5. Avoid duplicating engines, modules, pages, services, or business logic.
6. Prepare the platform for future workspace types without redesign.
7. Carry forward non-blocking ARC-002 audit findings into proper refactor scope.

## 4. ARC-002 Audit Findings Carried Forward

### Finding 1: Legacy Operator RBAC Role

Legacy `operator` terminology still exists in historical RBAC routes and role checks.

ARC-003 action:

- Identify remaining Operator references.
- Classify each reference as legacy compatibility, RBAC migration candidate, or documentation-only legacy reference.
- Do not introduce new Operator references.
- Prepare Operator-to-Member migration plan if full cleanup is unsafe.

### Finding 2: Legacy Track / BusinessMode Branching

Legacy content and funnel logic still uses `track` or `businessMode` values such as `retail` / `recruitment`.

ARC-003 action:

- Move engine behavior selection toward Workspace Manifest / Workspace Config.
- Ensure engines consume resolved Workspace Context instead of hardcoded branch logic.
- Keep template and copy differences in configuration, not engine forks.

## 5. Engine Scope

ARC-003 applies to:

- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- AI Coach Engine
- AI COO
- Workflow / Automation integration points where safe

No engine may be duplicated.

Forbidden:

- Retail Content Engine
- Recruitment Content Engine
- Retail Funnel Engine
- Recruitment Funnel Engine
- Retail CRM Engine
- Recruitment CRM Engine
- Retail AI Coach
- Recruitment AI Coach

## 6. Required Engine Execution Pattern

Preferred pattern:

```ts
engine.execute(input, workspaceContext)
```

Acceptable project-specific alternatives:

```ts
service.method(input, { workspaceContext })
```

```ts
applicationService.execute({
  ...input,
  workspaceContext,
})
```

Forbidden pattern:

```ts
if (workspaceType === 'retail') {
  retailEngine.execute(input)
}

if (workspaceType === 'recruitment') {
  recruitmentEngine.execute(input)
}
```

## 7. Workspace Context Contract

Every workspace-aware engine should consume a normalized context contract.

Minimum expected fields:

- `workspaceId`
- `workspaceType`
- `workspaceConfig`
- `capabilities`
- `templateNamespace`
- `themeKey`
- `memberId`, when available
- `membership`, when available
- `role`, when available
- `permissions`, when available

Engines should not resolve workspace state independently unless they are explicitly part of the Workspace Resolver layer.

## 8. Configuration-Driven Behavior

Retail and Recruitment differences must be represented through:

- Workspace Manifest
- Workspace Config
- Capability Registry
- Template Namespace
- Prompt Profile
- Analytics Profile
- CRM Profile
- Funnel Profile
- Content Profile

Engine internals should resolve behavior from context and configuration.

## 9. Request-Level Context Resolution

ARC-003 introduces request-level Workspace Context resolution.

Required flow:

```text
Request
  |
Member / Session
  |
Workspace Resolver
  |
Workspace Context
  |
Shared Engine
```

Legacy flow:

```text
Request without workspace
  |
Default Workspace
  |
Shared Engine
```

No existing route should break because `workspaceId` is absent.

## 10. Backward Compatibility Requirements

ARC-003 must preserve:

- Existing APIs
- Existing service calls
- Existing CAP-001 through CAP-008 behavior
- Existing Design System behavior
- Legacy Single Business Flow
- Optional Workspace Context behavior

Any breaking change must be rejected.

## 11. Database Scope

ARC-003 is not primarily a database migration phase.

Allowed:

- Add non-destructive planning.
- Add repository interfaces.
- Add optional workspace-aware query parameters.
- Prepare migration notes.

Not allowed unless explicitly safe:

- Destructive migration
- Required `workspace_id NOT NULL` enforcement
- Breaking record reads without workspace context
- Removing legacy compatibility paths

## 12. Required Deliverables

- Engine Context Review
- Workspace Context injection standard
- Engine integration updates
- Residual `track` / `businessMode` inventory
- Operator reference inventory
- Backward compatibility notes
- Updated tests
- Updated architecture documentation
- Implementation report

## 13. Documents

Current:

- `docs/architecture/ARC-003_ENGINE_CONTEXT_REFACTOR.md`
- `docs/audit/ARC_003_CODEX_IMPLEMENTATION_REPORT.md`

Future lifecycle documents:

- `docs/audit/ARC_003_IMPLEMENTATION_REPORT.md`
- `docs/audit/ARC_003_VERIFICATION_CHECKLIST.md`
- `docs/audit/ARC_003_CLAUDE_CODE_ARCHITECTURE_AUDIT_TASK.md`
- `docs/audit/ARC_003_AUDIT_REPORT.md`
- `docs/audit/ARC_003_RELEASE_NOTES.md`

## 14. Validation Requirements

Project-standard validation:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

If the full suite fails due to pre-existing infrastructure dependency, document the command, failing suite, root cause, and whether ARC-003 introduced the failure.

## 15. Implementation Status

ARC-003 implementation is complete for the primary shared-engine routes and services.

Implemented:

- Request-level Workspace Context resolution through `src/modules/workspace/request-workspace-context.ts`.
- Normalized engine context helper through `src/modules/workspace/workspace-engine-context.ts`.
- Workspace Context propagation into Content, CRM, Analytics, Funnel, Landing, Lead Magnet, Traffic, AI Coach, and AI COO entry points.
- Legacy `track` inputs preserved as optional compatibility hints.
- Operator references inventoried and deferred to a focused RBAC migration.

Implementation report:

- [ARC-003 Codex Implementation Report](../audit/ARC_003_CODEX_IMPLEMENTATION_REPORT.md)
