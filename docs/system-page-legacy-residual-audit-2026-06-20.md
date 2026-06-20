# System Page Legacy Residual Audit

Date: 2026-06-20
Environment: production, authenticated as user account provided in the Codex thread
Scope: user-facing authenticated pages and route references that can still expose legacy system modules.

## Executive Summary

The production app still has several legacy modules reachable from direct routes, mission logic, roadmap logic, or quick actions. The most urgent issue is the AI Content Engine: the visible `/content-engine` page looks like a newer command center, but it contains hardcoded demo recommendations and routes users into the older generator through `?mode=generator`.

The second urgent issue is trust erosion from blank or premature pages. `/ai-workforce` renders no main content for the audited user, while older engine pages such as `/traffic-engine`, `/webinar-center`, `/whatsapp-ai`, and `/sales` still expose pre-V8 language, readiness/quality scores, and English module names.

## P0 Findings

### 1. AI Content Engine Is a Mixed Old/New Experience

Production evidence:
- `/content-engine` shows the new heading `AI 内容引擎`.
- The same page shows static/demo values: `为什么大部分人副业失败？`, `互动率 +38%`, `潜在客户 +12`, `2.4 倍`.
- `完整仪表盘` and `查看完整日历` both link back to `/content-engine`, creating self-loop CTAs.
- `生成推荐内容` routes to `/content-engine?mode=generator&generate=smart&platform=facebook`.
- `/content-engine?mode=generator` exposes the older generator UI with `内容支柱`, `生成帖子`, `质量 53%`, and an inconsistent `99 天日历已生成`.

Source evidence:
- `src/app/(auth)/content-engine/page.tsx`
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/content-engine/components/ContentEngineDashboard.tsx`
- `src/modules/activation/services/activation-projection.ts`

Recommended fix:
- Make one canonical Content Center.
- Remove `?mode=generator` from all user-facing CTAs.
- Replace hardcoded command-center recommendations with real content state or an explicit empty state.
- Route planning CTAs to either `/ai/content-plan` or `/brand-builder/calendar`, after product decides which is canonical.

### 2. AI Workforce Direct Route Can Render Blank

Production evidence:
- `/ai-workforce` showed nav/header only and no main content for the audited user.

Source evidence:
- `src/app/(auth)/ai-workforce/page.tsx`
- `src/modules/ai/components/WorkforceDashboard.tsx`
- Route references remain in `src/modules/dashboard/components/WorkforceCard.tsx`, `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`, `src/modules/mission-engine/services/mission-service.ts`, and `src/modules/business-intelligence/ceoAdvisorEngine.ts`.

Recommended fix:
- If `activeAgents == 0`, hide entry points or show a deliberate locked/empty state.
- Do not allow a blank workspace page.
- Follow the dashboard rule: workforce should appear only after Content Agent, Lead Magnet Agent, and Funnel Agent are activated.

### 3. Legacy Engine Pages Are Still Reachable

Production evidence:
- `/traffic-engine` shows `Traffic Engine`, readiness score `21%`, and copy referencing `Funnel Builder` and `Lead Magnet Builder`.
- `/webinar-center` shows `Webinar Center`, score `79%`, and a literal bug: `大纲 ({pkg.outline.recommendedDuration})`.
- `/whatsapp-ai` shows `WhatsApp AI 助理`, `0 Leads`, smart replies, objection handling, follow-up plans, and sales scripts.
- `/sales` shows `Sales Engine` and English lock copy.

Source evidence:
- `src/modules/traffic-engine/components/TrafficDashboard.tsx`
- `src/modules/webinar-center/components/WebinarDashboard.tsx`
- `src/modules/whatsapp-ai/components/WhatsAppDashboard.tsx`
- `src/modules/sales-engine/components/SalesDashboard.tsx`
- `src/modules/mission/constants/sidebar-config.ts`

Recommended fix:
- Decide whether these are still product surfaces. If not, redirect to canonical centers or hide until unlocked.
- If still active, rebuild their copy and empty states to match V8 advisor style.
- Patch the webinar literal string bug immediately if the route remains public.

## P1 Findings

### 4. Content System Has Four Competing Entry Points

Production evidence:
- `/content-engine`: command-center shell with static content.
- `/content-engine?mode=generator`: older post/calendar generator.
- `/ai/content-plan`: newer `30天文案规划` tool.
- `/brand-builder/calendar`: calendar view with existing 99-item generated content.

Issues:
- The user cannot tell which is the real Content Engine.
- `/brand-builder/calendar` shows content pillar percentages as blank `%`.
- The product says AI Content Engine should feel like an execution engine, but the implementation is split across tools.

Recommended fix:
- Define one canonical content route.
- Move planning, calendar, and generator into one flow or make subordinate pages clearly linked from the canonical page.
- Fix blank content pillar percentages and the 99-day calendar inconsistency.

### 5. Journey And Mission Logic Still Routes Users Into Legacy Modules

Source evidence:
- `src/modules/growth-roadmap/services/roadmap-service.ts`
- `src/modules/journey-engine/journey-state-machine.ts`
- `src/modules/mission-engine/services/mission-service.ts`
- `src/modules/funnel/services/funnel-health-service.ts`
- `src/modules/mission-engine/missionStages.ts`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`
- `src/modules/dashboard/components/TodaysActionCard.tsx`

Examples:
- `/traffic-engine`
- `/whatsapp-ai`
- `/webinar-center`
- `/sales`
- `/lead-magnet`
- `/ai-workforce`

Recommended fix:
- Create a canonical route map for V8 execution surfaces.
- Update mission, journey, roadmap, dashboard recommendations, and funnel health services to use that map.
- Add tests for legacy-route regression.

### 6. Analytics Center Is Technically Working But Product Language Is Still Internal

Production evidence:
- `/analytics-center` shows `Analytics Intelligence Center`, `Facts from analytics. Conclusions from canonical projections.`, `Readiness · Business State`, and technical projection language.

Recommended fix:
- If this is not meant for the homepage-level user, move it behind an Insights Center.
- If it remains user-facing, translate internal terms into advisor-style explanations and add a clear empty/low-data state.

### 7. AI Coach Quick Start Still Points To Old Funnel Builder Route

Production evidence:
- `/ai/coach` quick start includes `创建漏斗` linking to `/funnel-builder`.

Recommended fix:
- Point to `/funnel` or the current canonical funnel creation page.
- Add route regression coverage for quick-start cards.

## P2 Findings

### 8. Lead Magnet Is Mostly Current But Still Carries Legacy Fallback Copy

Production evidence:
- `/lead-magnet` shows current resource + landing page flow for the audited user.

Source evidence:
- `src/modules/lead-magnet/components/LeadMagnetDashboard.tsx` contains fallback copy: `这是旧版评估型引流磁铁。请选择上方资源类型，重新生成新版资源和 Landing Page。`

Recommended fix:
- Keep the migration warning only if users with old data can still hit it.
- If retained, make it a proper migration state with one clear action.

### 9. Naming And Language Are Inconsistent

Examples:
- `Traffic Engine`
- `Sales Engine`
- `Webinar Center`
- `WhatsApp AI`
- `Today's Assignments`
- `Advanced Override`
- `Business State readiness`

Recommended fix:
- Standardize public Chinese labels and advisor-style copy.
- Reserve internal English system labels for admin/developer-only pages.

### 10. Placeholder API Route Still Exists

Source evidence:
- `src/app/api/v1/auth/route.ts` returns `status: 'placeholder'`.

Recommended fix:
- Remove if unused.
- If needed for health/debug, move behind admin/debug naming and authentication.

## Suggested Fix Order

1. Content Engine consolidation:
   - remove static demo metrics from `/content-engine`
   - remove self-loop CTAs
   - retire or hide `?mode=generator`
   - choose canonical planning/calendar route

2. Route visibility guard:
   - make `/ai-workforce` non-blank
   - hide workforce entry points until agents exist
   - hide or guard `/analytics-center` if it is not meant for basic users

3. Legacy page routing:
   - redirect or rebuild `/traffic-engine`, `/webinar-center`, `/whatsapp-ai`, `/sales`
   - patch webinar literal string if the route remains public

4. Mission and journey route map:
   - centralize canonical routes
   - update mission, journey, roadmap, recommendation, and quick-start references
   - add route-regression tests

5. Data cleanup:
   - investigate 99 generated content items
   - fix blank content pillar percentages
   - investigate duplicated funnel entries

## Browser QA Notes

Authenticated production route audit covered:
- `/content-engine`
- `/content-engine?mode=generator`
- `/ai/content-plan`
- `/brand-builder/calendar`
- `/lead-magnet`
- `/traffic-engine`
- `/webinar-center`
- `/whatsapp-ai`
- `/sales`
- `/ai-workforce`
- `/analytics-center`
- `/crm`
- `/member`
- `/ai/coach`

Pages that looked acceptable at a quick pass:
- `/crm` has a clear empty state.
- `/member` has a clear zero-state, though it may need richer onboarding context.
- `/lead-magnet` is mostly current for the audited user.

