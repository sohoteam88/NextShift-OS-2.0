# Team Dependency Audit

## 1. Dependency Graph

### Legacy Team Surface

`/team/growth`
→ `src/modules/team-engine/components/TeamDashboard.tsx`
→ `src/modules/team-engine/hooks/useTeamEngine.ts`
→ `useUserEvolution()`
→ `getUserLevel()`
→ `unlock-service`
→ evolution authority

### Modern Team Surface

`/team`
→ `src/modules/team/components/TeamOverviewDashboard.tsx`
→ `teamService`
→ `leaderDashboardService`
→ Prisma queries
→ database authority

### Leader Dashboard Route

`/dashboard`
→ `src/modules/team/components/LeaderDashboard.tsx`
→ `leaderDashboardService`
→ `teamService`
→ Prisma queries
→ database authority

## 2. Evolution Sources

| Source | Classification | Notes |
| --- | --- | --- |
| `useUserEvolution` | Direct | Imported directly by `useTeamEngine` |
| `useEvolutionProjection` | Not Used | Team does not currently import it |
| `getUserLevel` | Indirect | Reached through `useUserEvolution` |
| `unlock-service` | Indirect | Reached through `useUserEvolution` |
| `missionService` | Indirect | Reached through `useUserEvolution` via `useMissionState()` |

## 3. Hidden Consumers

The legacy Team engine still powers:
- `src/modules/team-engine/hooks/useTeamEngine.ts`
- `src/modules/team-engine/components/TeamDashboard.tsx`
- `src/app/(auth)/team/growth/page.tsx`

Behavior that still depends on evolution:
- leader lock gate
- `showViewOnly` for operator
- `showFull` for leader
- lock reason copy tied to leader unlock

The modern Team surface is separate and does not depend on evolution:
- `src/modules/team/components/TeamOverviewDashboard.tsx`
- `src/modules/team/components/LeaderDashboard.tsx`
- `src/modules/team/services/team-service.ts`
- `src/modules/team/services/leader-dashboard-service.ts`

## 4. Projection Readiness

**PARTIAL**

Reason:
- modern Team pages are projection-neutral
- the legacy Team engine still imports `useUserEvolution()`
- Team is not fully ready until `/team/growth` is migrated

## 5. Migration Difficulty

**HIGH**

Reason:
- Team is split across modern and legacy surfaces
- the legacy engine gates leader access
- the modern dashboards already depend on database-backed team services and should not be disturbed

## 6. Split Surface Analysis

Team has a clear split surface:

### Legacy Team Surface
- `/team/growth`
- `TeamDashboard`
- `useTeamEngine`

### Modern Team Surface
- `/team`
- `TeamOverviewDashboard`
- `LeaderDashboard`
- `teamService`
- `leaderDashboardService`

This is structurally similar to CRM, with one legacy gate surface and one modern service-backed surface.

## 7. Leadership Dependency Analysis

### Leader View

`Leader View`
→ `useTeamEngine`
→ `useUserEvolution`
→ `evolution level === leader`

### Organization View

`Organization View`
→ `TeamOverviewDashboard`
→ `teamService` / `leaderDashboardService`
→ role-based auth and database records

### Recruitment View

`Recruitment View`
→ `useTeamEngine`
→ `useUserEvolution`
→ `showViewOnly` / `showFull`

### Dependency Summary

- Legacy Team gating depends on **Evolution Level**
- Modern Team dashboards depend on **Role** and **Custom Team Logic**
- Unlock state is only relevant to the legacy team engine

## 8. Recommended Migration Order

1. Migrate `useTeamEngine()` to `useEvolutionProjection()`
2. Preserve legacy lock copy and leader-only/full-view behavior
3. Keep `/team`, `teamService`, and `leaderDashboardService` unchanged
4. Verify `/team/growth` for explorer, builder, operator, and leader
5. Confirm `/team` and `/dashboard` remain unchanged

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Notes

- No Team code was modified in this audit.
- No projection code was modified in this audit.
- No evolution hook was modified in this audit.
