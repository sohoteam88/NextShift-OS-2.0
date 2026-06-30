# ARC-003 Codex Implementation Task

Version: 1.0  
Status: Ready for Implementation  
Architecture Track: NextShift OS 3.1  
Depends On: ARC-001, ARC-002

## 1. Objective

Implement **ARC-003 Engine Context Refactor**.

The goal is to refactor the shared engine layer so all business engines can consistently consume `WorkspaceContext` without duplicating engines, modules, pages, or business logic.

This phase must preserve the core NextShift OS 3.1 principle:

**One Platform. One AI Brain. One Business Memory. One Engine Layer. Multiple Workspace Configurations.**

## 2. Implementation Scope

ARC-003 must focus on Workspace Context adoption inside the shared engine layer.

Target areas:

- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- AI Coach
- AI COO
- Workflow / Automation integration points where safe

Do not perform large UI redesign.

Do not perform destructive database migration.

Do not duplicate existing engines.

## 3. Required Repository Review

Before coding, scan and document current usage of:

- `workspaceContext`
- `workspaceType`
- `track`
- `businessMode`
- `retail`
- `recruitment`
- `operator`

Classify findings into:

1. Already workspace-aware
2. Legacy compatibility
3. Engine branching to refactor
4. Template/copy selection
5. RBAC / identity migration candidate
6. Documentation-only historical reference

Include the inventory summary in the Codex implementation report.

## 4. Required Implementation

### 4.1 Engine Context Standard

Create or formalize a standard Workspace Context execution pattern.

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

All new context parameters must remain backward compatible.

### 4.2 Shared Engine Context Integration

Ensure these shared engines/services accept or propagate `WorkspaceContext` consistently:

- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- AI Coach
- AI COO

Do not create workspace-specific engine forks.

### 4.3 Track / BusinessMode Consolidation

Business differences should resolve from `workspaceContext.workspaceConfig`.

Templates, copy, prompt profiles, analytics profiles, CRM profiles, and funnel profiles must be configuration-driven.

If full removal is unsafe, document exact remaining branches and why they remain.

### 4.4 Operator Reference Inventory

Do not perform risky identity rewrites unless clearly safe.

Required work:

- Inventory remaining `operator` references.
- Confirm ARC-003 introduces no new Operator model or role dependency.
- Classify legacy references for future migration.
- Document recommended migration path toward Member + WorkspaceMembership + Role.

### 4.5 Request-Level Workspace Context Preparation

Introduce or prepare a request-level context resolution pattern.

Target flow:

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

Legacy fallback:

```text
Request without workspace
  |
Default Workspace
  |
Shared Engine
```

Do not require all APIs to provide `workspaceId` yet.

## 5. Backward Compatibility Requirements

ARC-003 must preserve existing APIs, service calls, CAP behavior, Design System behavior, legacy Single Business Flow, and optional Workspace Context behavior.

Any required signature change must be trailing and optional.

No breaking change is allowed.

## 6. Documentation Requirements

Add or update:

- `docs/architecture/ARC-003_ENGINE_CONTEXT_REFACTOR.md`
- `docs/audit/ARC_003_CODEX_IMPLEMENTATION_REPORT.md`

## 7. Validation Requirements

Run:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

If full test suite fails because of a known local infrastructure dependency, document exact command, failing suite, root cause, and whether ARC-003 introduced the failure.

Also run targeted workspace/engine tests where available.

## 8. Architecture Guardrails

Codex must verify:

- No duplicated engines
- No duplicated modules
- No duplicated pages
- No new Operator concept
- Member-centric identity preserved
- Workspace Context centralized
- Workspace Registry / Manifest used for behavior
- No hardcoded Retail / Recruitment engine forks
- Backward compatibility preserved
- Design System regression: none
- CAP-001 through CAP-008 regression: none
- Type safety maintained
- Tests updated

## 9. Definition of Done

ARC-003 implementation is complete only when:

- Shared engines consistently accept or propagate Workspace Context.
- Legacy `track` / `businessMode` logic is reduced, isolated, or documented.
- Operator references are inventoried.
- No new Operator references are introduced.
- Backward compatibility is maintained.
- Tests and build are validated.
- Implementation report is complete.
- No engine, page, or module duplication is introduced.
