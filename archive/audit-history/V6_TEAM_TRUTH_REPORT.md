# V6 Team Truth Report

## 1. Team Sources

- **Canonical live team data**: `src/modules/team/services/team-service.ts`
  - Owns tree, direct downline, team summary, per-user stats, and downline traversal.
  - Reads from `user`, `lead`, `content`, `activity`, `dailyAction`, `trainingProgress`, and tenant settings.
- **Leader projection layer**: `src/modules/team/services/leader-dashboard-service.ts`
  - Builds leader-facing summary, alerts, trends, and performance tables.
  - Depends on `teamService` for downline traversal, then adds its own aggregation.
- **Admin organization overview**: `src/modules/admin/services/workspaceHealthService.ts`
  - Builds workspace-wide health and org metrics for `/admin/team`.
  - Reads directly from database tables and does not go through `teamService`.
- **Legacy team engine**: `src/modules/team-engine/*`
  - Static/derived org metrics and onboarding gates.
  - Uses hardcoded sample stats and evolution-based locking.

## 2. Team Dependency Graph

`/team` -> `TeamOverviewDashboard` -> `/api/v1/team/summary`, `/api/v1/team/tree`, `/api/v1/team/members`

`/team/members` -> `TeamOverviewDashboard` -> same live team API set

`/api/v1/team/summary|tree|members` -> `teamService`

`/team/dashboard` -> `LeaderDashboard` -> `/api/v1/team/dashboard` -> `leaderDashboardService` -> `teamService`

`/team/growth` -> `TeamDashboard` -> `useTeamEngine` -> `user-evolution` + static sample metrics

`/admin/team` -> `AdminTeamCenter` -> `workspaceHealthService`

## 3. Route Audit

- `src/app/(auth)/team/page.tsx`
  - Authenticated live team tree view.
  - Members are redirected away to `/dashboard`.
- `src/app/(auth)/team/members/page.tsx`
  - Authenticated live team list view.
- `src/app/(auth)/team/growth/page.tsx`
  - Legacy engine surface, not the real team data source.
- `src/app/(auth)/admin/team/page.tsx`
  - Admin command center backed by `workspaceHealthService`.
- No `/team/leaders` route exists in the app tree.

## 4. Dashboard Integration Audit

- `DashboardV4` calls `useDashboardMission()`.
- `useDashboardMission()` fetches `/api/v1/team/summary` for quick stats.
- That integration is partially broken:
  - `teamService.getTeamSummary()` returns only `totalMembers`, `activeMembers`, `totalLeads`, `totalConversions`.
  - The dashboard hook expects `content`, `leads`, `customers`, `revenue` fields that the summary does not provide.
  - Result: the dashboard snapshot can silently fall back to zeros.
- So the dashboard is reading team data, but not correctly shaping it.

## 5. Revenue -> Team Audit

- Public funnel submissions create **leads**, not team members.
- `src/app/api/v1/public/funnel/[slug]/submit/route.ts`
  - creates `prisma.lead`
  - updates scoring and activity
  - increments funnel conversions
  - does **not** create `user`, `sponsorId`, or leader role changes
- Member creation is separate and invite-based:
  - `src/app/api/v1/member/register/route.ts`
  - `src/modules/member/services/invite-service.ts`
  - `src/modules/member/services/approval-service.ts`
- Conclusion: Revenue -> Team is not automatic.

## 6. Team -> Leader Audit

- Leader progression is inferred by evolution logic, not by actual team mutations.
- `src/modules/user-evolution/services/user-level-service.ts`
  - `leader` is inferred from milestone completion.
  - No code here promotes a user role to leader.
- `src/modules/team-engine/hooks/useTeamEngine.ts`
  - locks `/team/growth` until `evolution.level === 'leader'`.
  - This is a view gate, not a promotion engine.
- `src/app/api/v1/team/journey-progress/route.ts`
  - exposes member journey progress to leaders/operators.
- Conclusion: Member -> Leader progression is not automatic in the product sense.

## 7. Organization Truth Audit

- Live organization hierarchy and summary truth comes from `teamService`.
- Admin-wide organization health truth comes from `workspaceHealthService`.
- Legacy organization numbers in `/team/growth` come from `team-engine` and are not live data.
- The product currently has three overlapping organizational views:
  - live team graph and summary
  - admin workspace health
  - legacy team engine sample metrics

## 8. Conflict Analysis

- `teamService` is the real data authority for team hierarchy.
- `leaderDashboardService` is a projection over `teamService`, but it adds its own aggregation and alert logic.
- `workspaceHealthService` independently computes organization metrics and does not reuse team summaries.
- `team-engine` shows static metrics and a separate lock model based on evolution level.
- `DashboardV4` expects richer team stats than `/api/v1/team/summary` actually returns.
- Net result: one domain, multiple competing read models.

## 9. Production Truth

- `/team` and `/team/members` are live, authenticated, database-backed team pages.
- `/team/dashboard` is a leader projection backed by `leaderDashboardService`.
- `/team/growth` is legacy `team-engine`, not the canonical team source.
- `/admin/team` is an admin org command center with separate truth.
- The current production state is functional, but the authority model is fragmented.

## 10. Single Source Of Truth Recommendation

- Make `src/modules/team/services/team-service.ts` the single source of truth for Team.
- Keep `leaderDashboardService` as a pure projection layer over `teamService`.
- Replace `team-engine` metrics with reads from `teamService` or a derived projection built from it.
- Make `workspaceHealthService` consume the same canonical team/org projection instead of recomputing overlapping counts.
- Fix `DashboardV4` to consume a typed snapshot that matches the actual team summary contract.

## Final Answers

1. **What is the real Team authority?** `Multiple conflicting systems`
2. **Who owns organization data?** Split ownership today: `teamService` for live team hierarchy/summary, `workspaceHealthService` for admin workspace org health, `team-engine` for legacy static org views.
3. **Is Revenue -> Team automatic?** `NO`
4. **Is Member -> Leader progression automatic?** `NO`
5. **What should become the Team Single Source Of Truth?** `teamService`
