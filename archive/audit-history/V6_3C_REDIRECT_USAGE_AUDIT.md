# V6.3C Redirect Usage Audit

Scope: repository-wide search for legacy route usage. I inspected `src/**`, `docs/**`, `audit/**`, `prompts/**`, `agents/**`, and `skills/**` for active references to:

- `/ai`
- `/customers`
- `/team/growth`
- `/brand-dna`
- `/crm-center`
- `/admin-command`
- `/workspace`

No code changes were made.

## Final Conclusion

The legacy route set is mixed:

- `/ai` is still actively referenced and should be treated as an alias with live consumers.
- `/crm-center` and `/admin-command` are still live duplicate surfaces with runtime consumers.
- `/customers`, `/team/growth`, and `/brand-dna` are live legacy surfaces, but I found no current internal runtime route-string references outside their own page surfaces and historical docs.
- `/workspace` is a redirect-only compatibility alias.

The remaining risk is not route removal from the router layer. It is stale deep links and AI-generated actions still emitting old destinations.

## 1. Reference Inventory

### `/ai`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/app/(auth)/crm/[id]/page.tsx` | CRM lead detail actions | CTA |
| `src/app/(auth)/ai/coach/page.tsx` | AI Coach | Navigation / CTA |
| `src/app/(auth)/platform-admin/ai-usage/page.tsx` | Platform Admin AI Usage | Navigation |
| `src/app/api/v1/ai/coach/recommend/route.ts` | AI Coach recommendation API | AI Recommendation |
| `docs/navigation-audit.md` | Route inventory / guidance | Documentation |

### `/customers`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/app/(auth)/customers/page.tsx` | Legacy CRM engine surface | Legacy surface |
| `src/app/(auth)/crm/customers/page.tsx` | CRM customer page | Navigation |
| `docs/navigation-audit.md` | CRM route inventory | Documentation |
| `audit/ROUTE_AUTHORITY_AUDIT.md` and `audit/LEGACY_USAGE_AUDIT.md` | Historical audit notes | Documentation |

### `/team/growth`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/app/(auth)/team/growth/page.tsx` | Legacy team engine surface | Legacy surface |
| `docs/navigation-audit.md` | Route inventory / guidance | Documentation |
| `audit/ROUTE_AUTHORITY_AUDIT.md` and `audit/LEGACY_USAGE_AUDIT.md` | Historical audit notes | Documentation |

### `/brand-dna`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/app/(auth)/brand-dna/page.tsx` | Brand DNA studio surface | Legacy surface |
| `docs/navigation-audit.md` | Route inventory / guidance | Documentation |
| `docs/architecture/ADR-006-journey-engine.md` | Journey flow guidance | Documentation |
| `audit/ROUTE_AUTHORITY_AUDIT.md` and `audit/journey-flow-fix.md` | Historical audit notes | Documentation |

### `/crm-center`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/modules/crm/components/CRMDashboard.tsx` | CRM dashboard | Dashboard |
| `src/modules/ai/agents/crm-manager.ts` | AI agent actions | AI Recommendation |
| `docs/navigation-audit.md` | CRM duplicate surface inventory | Documentation |
| `docs/domain-boundary-report.md` | CRM boundary mapping | Documentation |

### `/admin-command`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/modules/admin/components/AdminCommandDashboard.tsx` | Admin command dashboard | Dashboard |
| `docs/navigation-audit.md` | Team and admin route inventory | Documentation |
| `docs/domain-boundary-report.md` | Admin boundary mapping | Documentation |

### `/workspace`

| File | Component | Reference Type |
| --- | --- | --- |
| `src/app/(auth)/workspace/page.tsx` | Redirect alias | Redirect |
| `src/app/(auth)/workspace/[...path]/page.tsx` | Nested redirect alias | Redirect |
| `docs/navigation-audit.md` | Admin alias inventory | Documentation |
| `audit/ROUTE_AUTHORITY_AUDIT.md` | Historical route authority notes | Documentation |

## 2. Internal Runtime Usage

### Dashboard

- `/ai`: still used by platform-admin AI usage and AI coach entry points, but not by the main dashboard after V6.3B.
- `/crm-center`: used by CRM command-center projections, not the main dashboard.
- `/admin-command`: not used by the main dashboard.
- `/customers`, `/team/growth`, `/brand-dna`, `/workspace`: not used by the main dashboard.

### Journey

- `/brand-dna`: historically mentioned in journey guidance, but current journey flows now point to `/brand-builder/profile`.
- `/ai`, `/customers`, `/team/growth`, `/crm-center`, `/admin-command`, `/workspace`: not used by journey runtime after the navigation consolidation work.

### Mission Engine

- `/ai`: no longer emitted by mission stages after V6.3B.
- `/customers`, `/team/growth`, `/brand-dna`, `/crm-center`, `/admin-command`, `/workspace`: not used by mission runtime.

### Roadmap Engine

- `/brand-dna`, `/customers`, `/team/growth`, `/workspace`: not used.
- Roadmap has already been pointed at canonical routes.

### Activation Engine

- `/brand-dna`, `/customers`, `/team/growth`, `/crm-center`, `/admin-command`, `/workspace`: not used.
- Activation now targets `/brand-builder/profile` and `/crm`.

### AI Coach

- `/ai`: still used by the AI coach UI and recommendation flow.
- `/crm-center`: used by CRM-oriented AI agent output, not AI coach.
- Other legacy routes in the list are not emitted by AI coach.

### AI Agents

- `/ai`: still emitted by `src/app/api/v1/ai/coach/recommend/route.ts`.
- `/crm-center`: still emitted by `src/modules/ai/agents/crm-manager.ts`.
- `/brand-dna`, `/customers`, `/team/growth`, `/admin-command`, `/workspace`: not emitted by active AI agents in `src`.

## 3. AI Reference Audit

Current AI-generated legacy outputs:

- `src/app/api/v1/ai/coach/recommend/route.ts` still returns `actionHref: '/ai'`.
- `src/modules/ai/agents/crm-manager.ts` still emits `route: '/crm-center'`.

Current AI-generated canonical outputs:

- `src/modules/ai/agents/brand-strategist.ts` now emits `/brand-builder/profile` and `/content-engine`.
- `src/modules/ai/agents/ceo-advisor.ts` now emits `/brand-builder/profile`.
- `src/modules/business-intelligence/ceoAdvisorEngine.ts` now emits `/brand-builder/profile`, `/content-engine`, or `/ai-workforce` depending on context.

## 4. Documentation Audit

Active guidance still contains legacy route inventory:

- `docs/navigation-audit.md` lists `/ai`, `/crm-center`, `/admin-command`, `/brand-dna`, `/customers`, and `/team/growth`.

Historical audit docs also contain legacy route references:

- `audit/ROUTE_AUTHORITY_AUDIT.md`
- `audit/LEGACY_USAGE_AUDIT.md`
- `audit/CRM_DEPENDENCY_AUDIT.md`
- `audit/V6_EVOLUTION_TRUTH_REPORT.md`
- `audit/journey-flow-fix.md`
- `audit/V6_CRM_TRUTH_REPORT.md`

## 5. Alias vs Surface

| Route | Classification | Reason |
| --- | --- | --- |
| `/ai` | Alias | Redirects to `/content-engine`, but still has live callers. |
| `/customers` | Legacy Surface | Live page surface with legacy CRM behavior. |
| `/team/growth` | Legacy Surface | Live page surface for team engine behavior. |
| `/brand-dna` | Legacy Surface | Live brand studio surface, not a redirect alias. |
| `/crm-center` | Legacy Surface | Live duplicate CRM command center surface. |
| `/admin-command` | Legacy Surface | Live duplicate admin command center surface. |
| `/workspace` | Alias | Redirect-only compatibility route to `/admin`. |

## 6. Retirement Readiness

| Route | Status |
| --- | --- |
| `/ai` | PARTIAL |
| `/customers` | PARTIAL |
| `/team/growth` | PARTIAL |
| `/brand-dna` | PARTIAL |
| `/crm-center` | PARTIAL |
| `/admin-command` | PARTIAL |
| `/workspace` | READY |

Notes:

- `/workspace` is the only pure redirect alias in this set.
- The others still have live page surfaces or live AI/runtime consumers, so they are not safe to remove in this audit scope.

## 7. Deletion Impact

### `/ai`

Breaks:

- `src/app/(auth)/crm/[id]/page.tsx`
- `src/app/(auth)/ai/coach/page.tsx`
- `src/app/(auth)/platform-admin/ai-usage/page.tsx`
- `src/app/api/v1/ai/coach/recommend/route.ts`
- `docs/navigation-audit.md`

### `/customers`

Breaks:

- `src/app/(auth)/customers/page.tsx`
- legacy deep links and bookmarks

### `/team/growth`

Breaks:

- `src/app/(auth)/team/growth/page.tsx`
- legacy deep links and bookmarks

### `/brand-dna`

Breaks:

- `src/app/(auth)/brand-dna/page.tsx`
- historical journey links and bookmarks

### `/crm-center`

Breaks:

- `src/modules/crm/components/CRMDashboard.tsx`
- `src/modules/ai/agents/crm-manager.ts`
- direct bookmarks to the CRM command center

### `/admin-command`

Breaks:

- `src/modules/admin/components/AdminCommandDashboard.tsx`
- direct bookmarks to the admin command center

### `/workspace`

Breaks:

- `src/app/(auth)/workspace/page.tsx`
- `src/app/(auth)/workspace/[...path]/page.tsx`
- legacy admin bookmarks

## Bottom Line

- Safe to keep: `/ai`, `/customers`, `/team/growth`, `/brand-dna`, `/crm-center`, `/admin-command`
- Safe alias: `/workspace`
- Highest cleanup priority after this audit: the AI coach recommendation source still emitting `/ai`, and the CRM agent still emitting `/crm-center`
