# V6.1 PR-5 — Evolution Consumer Inventory

Discovery only. No code changes were made.

## Search Scope

Repository-wide scan completed for:
- `useUserEvolution(`
- `getUserLevel(`
- `isModuleUnlocked(`
- `getLockedReason(`
- `unlock-service`
- role checks and access gates
- feature-gated evolution wiring

## Summary

I found the expected direct consumers plus a smaller set of hidden/indirect consumers:
- Primary UI consumers: `Sidebar`, `DashboardV4`, `ContentCommandCenter`, `CRMDashboard`, `LeadDashboard`, `SalesDashboard`, `TeamDashboard`, `UnlockPreview`
- Helper chains: `useDashboardMission`, `useGrowthRoadmap`, `useContentEngine`, `usePublishingCenter`, `useLeadEngine`, `useCRMEngine`, `useSalesEngine`, `useTeamEngine`, `useUserEvolution`, `unlock-service`, `user-level-service`, `EvolutionAdapter`, `use-evolution-projection`
- Legacy / dead code: `useContentPerformance`, `ContentDashboard`

The main hidden consumer risk is in content and dashboard composition:
- `/content-engine` is backed by `ContentCommandCenter`, which depends on `useDashboardMission` and `usePublishingCenter`
- `ContentDashboard` is not wired anywhere; it is a legacy consumer candidate
- `useContentPerformance` has no call sites and is effectively orphaned

## Inventory

| Component / Helper | Location | Dependency | Purpose | Category | Priority |
| --- | --- | --- | --- | --- | --- |
| Sidebar | `src/components/layouts/Sidebar.tsx:224` | `useUserEvolution` | Role-based navigation, mission sidebar, unlock hints | Consumer | P1 |
| DashboardV4 | `src/modules/dashboard/components/DashboardV4.tsx:17-19` | `useDashboardMission`, `useGrowthRoadmap`, `UnlockPreview`, `useUserEvolution` | Main member dashboard projection | Consumer | P1 |
| ContentCommandCenter | `src/modules/content-engine/components/ContentCommandCenter.tsx:22-25` | `useDashboardMission`, `usePublishingCenter` | Live content engine command surface | Consumer | P3 |
| CRMDashboard | `src/modules/crm-engine/components/CRMDashboard.tsx:10-11` | `useCRMEngine`, `useDashboardMission` | CRM shell and lock gate | Consumer | P2 |
| LeadDashboard | `src/modules/lead-engine/components/LeadDashboard.tsx:10-11` | `useLeadEngine`, `useDashboardMission` | Lead engine shell and lock gate | Consumer | P3 |
| SalesDashboard | `src/modules/sales-engine/components/SalesDashboard.tsx:9` | `useSalesEngine` | Sales engine shell and lock gate | Consumer | P2 |
| TeamDashboard | `src/modules/team-engine/components/TeamDashboard.tsx:9` | `useTeamEngine` | Team engine shell and lock gate | Consumer | P2 |
| UnlockPreview | `src/modules/experience/components/UnlockPreview.tsx:6-7` | `useUserEvolution` | Locked preview card on dashboard | Consumer | P3 |
| useDashboardMission | `src/modules/dashboard/hooks/useDashboardMission.ts:44-62` | `getUserLevel`, `useMissionState` | Next action and mission selection | Helper | P1 |
| useGrowthRoadmap | `src/modules/growth-roadmap/hooks/useGrowthRoadmap.ts:21-29` | `getGrowthRoadmapState` | Roadmap projection for dashboard | Helper | P2 |
| getGrowthRoadmapState | `src/modules/growth-roadmap/services/roadmap-service.ts:49-131` | `getUserLevel`, `getUnlockedModules` | Roadmap calculation and unlock logic | Helper | P2 |
| useContentEngine | `src/modules/content-engine/hooks/useContentEngine.ts:8-18` | `useUserEvolution` | Content strategy + lock reason helper | Helper | P3 |
| usePublishingCenter | `src/modules/content-publishing/hooks/usePublishingCenter.ts:8-42` | `useUserEvolution` | Publishing queue and schedule gating | Helper | P3 |
| useLeadEngine | `src/modules/lead-engine/hooks/useLeadEngine.ts:6-17` | `useUserEvolution` | Lead engine gate and scoring surface | Helper | P3 |
| useCRMEngine | `src/modules/crm-engine/hooks/useCRMEngine.ts:8-24` | `useUserEvolution` | CRM gate and stats surface | Helper | P2 |
| useSalesEngine | `src/modules/sales-engine/hooks/useSalesEngine.ts:7-21` | `useUserEvolution` | Sales gate and forecast surface | Helper | P2 |
| useTeamEngine | `src/modules/team-engine/hooks/useTeamEngine.ts:7-22` | `useUserEvolution` | Team gate and onboarding surface | Helper | P2 |
| useUserEvolution | `src/modules/user-evolution/hooks/useUserEvolution.ts:15-69` | `getUserLevel`, `unlock-service` | Legacy evolution authority hook | Helper | P1 |
| user-level-service | `src/modules/user-evolution/services/user-level-service.ts:58` | progression inputs | Evolution level authority | Helper | P1 |
| unlock-service | `src/modules/user-evolution/services/unlock-service.ts:24-39` | level-to-module unlock rules | Module access authority | Helper | P1 |
| EvolutionAdapter | `src/modules/evolution/adapters/evolution-adapter.ts:93-105` | `getUserLevel`, `getUnlockedModules` | Canonical snapshot adapter | Helper | P1 |
| use-evolution-projection | `src/modules/evolution/hooks/use-evolution-projection.ts:49` | `useUserEvolution` fallback + `EvolutionProjection` | Feature-flag wiring between legacy and canonical path | Helper | P1 |
| ContentDashboard | `src/modules/content-engine/components/ContentDashboard.tsx:18-22` | `useContentEngine`, `useDashboardMission`, `usePublishingCenter` | Legacy content dashboard shell | Legacy | P3 |
| useContentPerformance | `src/modules/content-performance/hooks/useContentPerformance.ts:16-26` | `useUserEvolution` | Orphan performance gate helper | Legacy | P3 |

## Hidden Consumer Notes

- `content-engine`:
  - Live route consumer is `ContentCommandCenter`
  - `ContentDashboard` is not referenced anywhere else in the repo and should be treated as legacy
  - `ContentEngineDashboard` is content-data-only; it is not an evolution consumer
- `publishing-center`:
  - `usePublishingCenter` is an evolution-dependent helper because it gates publishing by `content-engine` unlock state
- `roadmap`:
  - `useGrowthRoadmap` and `roadmap-service` depend on `getUserLevel`, so the dashboard roadmap is an evolution projection, not a separate authority
- `crm helpers`:
  - `useCRMEngine` is the real evolution consumer behind `/crm`
- `team helpers`:
  - `useTeamEngine` is the real evolution consumer behind `/team`
- `dashboard helpers`:
  - `useDashboardMission` is the central helper fan-out point for dashboard, content, lead, and CRM surfaces
- `feature flags`:
  - `use-evolution-projection` is wiring only; it is not a consumer migration target

## Classification Result

No hidden evolution consumer was found outside the expected dashboard/content/CRM/sales/team surfaces. The only true dead surfaces in this scan are:
- `ContentDashboard`
- `useContentPerformance`

Those can be removed later after migration work is complete.
