# Platform Status

Status: Finalized registry
Project: Repository Architecture Reset v1.0
Migration Unit: MU-001 Platform Registry Migration

## Purpose

This status registry provides the current platform state for repository navigation. It does not replace current project status documents and does not change lifecycle ownership.

## Current Repository State

| Field | Current Value |
| --- | --- |
| Active planning branch | `planning/os-3.3-runtime-platform` |
| Current release status | v3.5.0 released to production; OS 3.6 Blueprint drafted (Stage A part 1, Business Memory), awaiting approval |
| Last Updated | 2026-07-12 |
| Current repository architecture project | Repository Architecture Reset v1.0 |
| Current RAR migration unit | MU-001 Platform Registry Migration |
| Migration mode | Registry-first platform navigation |
| Runtime migration | Deferred to separate runtime migration lifecycle |
| Runtime platform | NextShift Runtime Platform v1.0 integrated |
| Runtime MVP | NextShift Runtime MVP v1.0 integrated |
| Runtime implementation | NextShift Runtime Implementation v1.0 integrated |
| Runtime MVP Sprint-001 | Integrated |
| Runtime Sprint-002 | Integrated |
| Workflow catalog | NextShift Workflow Catalog v1.0 integrated |
| File movement | Not authorized |
| Release package migration | Not authorized |
| Registry state | Platform registry finalized for audit |

## Source-of-Truth Status Documents

| Area | Current Path |
| --- | --- |
| Project status dashboard | [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) |
| Master index | [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) |
| Capability status | [docs/nextshift-os-3/CAPABILITY_STATUS.md](../docs/nextshift-os-3/CAPABILITY_STATUS.md) |
| Runtime status | [docs/nextshift-os-3/RUNTIME_STATUS.md](../docs/nextshift-os-3/RUNTIME_STATUS.md) |
| Blueprint status | [docs/nextshift-os-3/BLUEPRINT_STATUS.md](../docs/nextshift-os-3/BLUEPRINT_STATUS.md) |

## Current Platform Baseline

| Platform Area | Current State | Reference |
| --- | --- | --- |
| NextShift Runtime Platform | Integrated | [NextShift Runtime Platform v1.0](NEXTSHIFT_RUNTIME_PLATFORM_v1.0.md) |
| NextShift Runtime MVP | Integrated | [NextShift Runtime MVP v1.0](NEXTSHIFT_RUNTIME_MVP_v1.0.md) |
| NextShift Runtime Implementation | Integrated | [NextShift Runtime Implementation v1.0](NEXTSHIFT_RUNTIME_IMPLEMENTATION_v1.0.md) |
| NextShift Runtime MVP Sprint-001 | Integrated | [NextShift Runtime MVP Sprint-001](NEXTSHIFT_RUNTIME_MVP_SPRINT_001.md) |
| NextShift Runtime Sprint-002 | Integrated | [NextShift Runtime Sprint-002](NEXTSHIFT_RUNTIME_SPRINT_002.md) |
| NextShift Workflow Catalog | Integrated | [NextShift Workflow Catalog v1.0](NEXTSHIFT_WORKFLOW_CATALOG_v1.0.md) |
| Business OS | Released | [Business OS](../docs/nextshift-os-3/business-os/README.md) |
| Business OS v1.0 | Released package exists at current path | [Business OS v1.0 release package](../docs/nextshift-os-3/business-os/releases/BUSINESS_OS_v1.0/README.md) |
| Engineering Standards | v1.1 baseline | [Engineering Standards v1.1](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md) |
| AI Engineering Foundation | Released | [AI Engineering Foundation release package](../docs/nextshift-os-3/ai/releases/AI_ENGINEERING_FOUNDATION_v1.0/README.md) |
| UI Kit | Released | [UI Kit](../docs/nextshift-os-3/ui-kit/README.md) |
| Workspace Experience Framework | WEF v1.0 released | [Workspace Experience Framework](../docs/nextshift-os-3/workspace-experience-framework/README.md) |

## Registry Scope Status

| Registry | Status |
| --- | --- |
| `platform/index.md` | Finalized by MU-001 |
| `platform/status.md` | Finalized by MU-001 |
| `governance/index.md` | Companion registry; not migrated by MU-001 |
| `releases/index.md` | Companion registry; not migrated by MU-001 |
| `audit/index.md` | Companion registry; not migrated by MU-001 |

## Registry-First Loading Rule

Use this loading order for platform navigation:

```text
platform/index.md
  -> platform/status.md
  -> relevant companion registry
  -> current source-of-truth document
  -> lifecycle artifact in scope
```

If registry content and conversation context conflict, use repository artifacts for factual state and preserve the operator's current task scope.

## Next Navigation Step

Use [platform/index.md](index.md) as the platform navigation entry point, then load the current source-of-truth document linked from the relevant registry.

## Compatibility Notes

- Current source documents under `docs/nextshift-os-3` remain active.
- No platform project folders have been moved by MU-001.
- No runtime paths have been changed by MU-001.
- Release package migration remains out of scope.
