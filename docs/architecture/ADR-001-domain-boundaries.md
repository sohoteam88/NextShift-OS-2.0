# ADR-001: Domain Boundaries

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** Architecture consolidation V3→V4→V5

## Context

NextShift OS started with 7 funnel-related modules and 3 AI-related modules, each with overlapping responsibilities. Cross-module imports created a tangled dependency graph. Three modules defined `FunnelType` with incompatible values. Four modules had independent health scoring engines.

## Decision

We consolidated 7 funnel modules into 1 and 3 AI modules into 1:

| Domain | Before | After | Key Change |
|---|---|---|---|
| **Funnel** | `funnel`, `funnel-builder`, `funnel-context`, `funnel-os` | `funnel/` | Single CRUD entry point, single health engine, single next-action engine |
| **AI** | `ai`, `ai-router`, `ai-agents` | `ai/` | Single model registry, single task classifier, single routing entry point |

### Principles Applied

1. **One canonical write path** — `funnelService.createInternal()` is the only function that inserts into the `Funnel` table.
2. **One canonical health engine** — `funnelHealthService` provides all health scoring (DB-backed, package-based, activity-based).
3. **One canonical task classifier** — 30 unified `TaskCategory` values replace 14+16 competing systems.
4. **Deprecated stubs preserve backward compatibility** — old import paths delegate to canonical locations.

## Consequences

- ✅ Zero cross-module imports between funnel and AI domains
- ✅ Zero circular dependencies in the entire codebase
- ✅ Single source of truth for business logic
- ✅ New features added to one place only
- ⚠️ Barrel exports needed for discoverability

## Related

- ADR-003 (Funnel Domain)
- ADR-004 (AI Domain)
