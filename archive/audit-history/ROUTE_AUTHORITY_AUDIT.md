# Route Authority Audit

Scope: page routes, redirecting route handlers, sidebar items, mobile tabs, dashboard entry points, and deep-link surfaces.

API routes were scanned for references, but they are excluded from the main authority tables because they are not navigable surfaces.

## Final Conclusion

NextShift OS now has a mostly clean route authority model, but it is not yet a single-route-per-domain system.

Canonical navigation already exists for the main product surfaces:

- `/dashboard`
- `/journey`
- `/content-engine`
- `/brand-builder`
- `/crm`
- `/team`
- `/admin`
- `/platform-admin`

There are still several active legacy or duplicate route surfaces:

- `/ai` is a redirect alias to `/content-engine`
- `/register` is a redirect alias to `/signup`
- `/workspace` and `/workspace/[...path]` are admin aliases
- `/brand-builder/video-script` is a redirect alias to `/video`
- `/ai/brand-builder` is a redirect alias to `/brand-builder`
- `/platform-admin/tenants` is a tab redirect alias
- `/crm-center`, `/admin-command`, `/customers`, `/team/growth`, `/brand-discovery`, and `/brand-dna` are still live but are not primary navigation endpoints
- `/[tenant_slug]/funnel/[funnel_slug]` is a public funnel variant, while `/f/[slug]` is the primary share URL

The biggest authority risk is not dead code. It is multiple live entry points for the same business surface.

---

## 1. Full Route Inventory

### Public and Auth Entry

| Route | Type | Domain | Source File |
| --- | --- | --- | --- |
| `/` | redirect | Public | `src/app/page.tsx` |
| `/login` | page | Auth | `src/app/login/page.tsx` |
| `/signup` | page | Auth | `src/app/signup/page.tsx` |
| `/register` | redirect | Auth | `src/app/register/page.tsx` |
| `/pending` | page | Auth | `src/app/pending/page.tsx` |
| `/join/[code]` | dynamic page | Member invite | `src/app/join/[code]/page.tsx` |

### Core Product Navigation

| Route | Type | Domain | Source File |
| --- | --- | --- | --- |
| `/dashboard` | page | Dashboard | `src/app/(auth)/dashboard/page.tsx` |
| `/journey` | page | Journey | `src/app/(auth)/journey/page.tsx` |
| `/content-engine` | page | Content | `src/app/(auth)/content-engine/page.tsx` |
| `/ai` | redirect | Content / AI alias | `src/app/(auth)/ai/page.tsx` |
| `/ai/coach` | page | AI | `src/app/(auth)/ai/coach/page.tsx` |
| `/ai/content-plan` | page | AI | `src/app/(auth)/ai/content-plan/page.tsx` |
| `/ai/image` | page | AI | `src/app/(auth)/ai/image/page.tsx` |
| `/ai/funnel-builder` | page | AI / Funnel | `src/app/(auth)/ai/funnel-builder/page.tsx` |
| `/ai/brand-builder` | redirect | Brand alias | `src/app/(auth)/ai/brand-builder/page.tsx` |
| `/brand-builder` | page | Brand | `src/app/(auth)/brand-builder/page.tsx` |
| `/brand-builder/profile` | page | Brand | `src/app/(auth)/brand-builder/profile/page.tsx` |
| `/brand-builder/guides` | page | Brand | `src/app/(auth)/brand-builder/guides/page.tsx` |
| `/brand-builder/calendar` | page | Brand / Content | `src/app/(auth)/brand-builder/calendar/page.tsx` |
| `/brand-builder/insights` | page | Brand / Content | `src/app/(auth)/brand-builder/insights/page.tsx` |
| `/brand-builder/video-script` | redirect | Brand alias | `src/app/(auth)/brand-builder/video-script/page.tsx` |
| `/brand-builder/step/interview` | page | Brand wizard | `src/app/(auth)/brand-builder/step/interview/page.tsx` |
| `/brand-builder/step/profile` | page | Brand wizard | `src/app/(auth)/brand-builder/step/profile/page.tsx` |
| `/brand-builder/step/accounts` | page | Brand wizard | `src/app/(auth)/brand-builder/step/accounts/page.tsx` |
| `/brand-builder/step/guides` | page | Brand wizard | `src/app/(auth)/brand-builder/step/guides/page.tsx` |
| `/brand-builder/step/strategy` | page | Brand wizard | `src/app/(auth)/brand-builder/step/strategy/page.tsx` |
| `/brand-builder/step/calendar` | page | Brand wizard | `src/app/(auth)/brand-builder/step/calendar/page.tsx` |
| `/brand-builder/step/complete` | page | Brand wizard | `src/app/(auth)/brand-builder/step/complete/page.tsx` |
| `/video` | page | Video | `src/app/(auth)/video/page.tsx` |
| `/video/new` | page | Video | `src/app/(auth)/video/new/page.tsx` |
| `/video/[id]` | dynamic page | Video | `src/app/(auth)/video/[id]/page.tsx` |
| `/crm` | page | CRM | `src/app/(auth)/crm/page.tsx` |
| `/crm/pipeline` | page | CRM | `src/app/(auth)/crm/pipeline/page.tsx` |
| `/crm/customers` | page | CRM | `src/app/(auth)/crm/customers/page.tsx` |
| `/crm/[id]` | dynamic page | CRM | `src/app/(auth)/crm/[id]/page.tsx` |
| `/crm-center` | page | CRM command center | `src/app/(auth)/crm-center/page.tsx` |
| `/lead-magnet` | page | Acquisition | `src/app/(auth)/lead-magnet/page.tsx` |
| `/funnel` | page | Acquisition | `src/app/(auth)/funnel/page.tsx` |
| `/funnel-builder` | page | Acquisition | `src/app/(auth)/funnel-builder/page.tsx` |
| `/funnel/[id]/edit` | dynamic page | Funnel builder | `src/app/(auth)/funnel/[id]/edit/page.tsx` |
| `/funnel/[id]/analytics` | dynamic page | Funnel builder | `src/app/(auth)/funnel/[id]/analytics/page.tsx` |
| `/sales` | page | Sales | `src/app/(auth)/sales/page.tsx` |
| `/customers` | page | Legacy CRM / conversion | `src/app/(auth)/customers/page.tsx` |
| `/team` | page | Team | `src/app/(auth)/team/page.tsx` |
| `/team/members` | page | Team | `src/app/(auth)/team/members/page.tsx` |
| `/team/growth` | page | Legacy team engine | `src/app/(auth)/team/growth/page.tsx` |
| `/member` | page | Member | `src/app/(auth)/member/page.tsx` |
| `/member/daily-actions` | page | Member | `src/app/(auth)/member/daily-actions/page.tsx` |
| `/member/voice` | page | Member | `src/app/(auth)/member/voice/page.tsx` |
| `/settings` | page | Settings | `src/app/(auth)/settings/page.tsx` |
| `/analytics` | page | Analytics | `src/app/(auth)/analytics/page.tsx` |
| `/analytics-center` | page | Analytics | `src/app/(auth)/analytics-center/page.tsx` |
| `/traffic-engine` | page | Growth | `src/app/(auth)/traffic-engine/page.tsx` |
| `/social-setup` | page | Brand setup | `src/app/(auth)/social-setup/page.tsx` |
| `/brand-dna` | page | Brand legacy | `src/app/(auth)/brand-dna/page.tsx` |
| `/brand-discovery` | page | Brand legacy | `src/app/(auth)/brand-discovery/page.tsx` |
| `/webinar-center` | page | Funnel / webinar | `src/app/(auth)/webinar-center/page.tsx` |
| `/whatsapp-ai` | page | AI / conversion | `src/app/(auth)/whatsapp-ai/page.tsx` |
| `/automation` | page | Automation | `src/app/(auth)/automation/page.tsx` |
| `/ai-workforce` | page | AI operations | `src/app/(auth)/ai-workforce/page.tsx` |
| `/saas` | page | SaaS | `src/app/(auth)/saas/page.tsx` |
| `/funnel-context` | page | Funnel context | `src/app/(auth)/funnel-context/page.tsx` |
| `/blueprints` | page | Blueprints | `src/app/(auth)/blueprints/page.tsx` |
| `/franchise` | page | Franchise | `src/app/(auth)/franchise/page.tsx` |
| `/ceo-mode` | page | Executive mode | `src/app/(auth)/ceo-mode/page.tsx` |
| `/billing` | page | Billing | `src/app/(auth)/billing/page.tsx` |
| `/localization` | page | Localization | `src/app/(auth)/localization/page.tsx` |
| `/help` | page | Help | `src/app/(auth)/help/page.tsx` |

### Admin and Platform Admin

| Route | Type | Domain | Source File |
| --- | --- | --- | --- |
| `/admin` | page | Admin | `src/app/(auth)/admin/page.tsx` |
| `/admin-command` | page | Admin command center | `src/app/(auth)/admin-command/page.tsx` |
| `/workspace` | redirect | Admin alias | `src/app/(auth)/workspace/page.tsx` |
| `/workspace/[...path]` | redirect | Admin alias | `src/app/(auth)/workspace/[...path]/page.tsx` |
| `/admin/approvals` | page | Admin | `src/app/(auth)/admin/approvals/page.tsx` |
| `/admin/ai-templates` | redirect | Admin alias | `src/app/(auth)/admin/ai-templates/page.tsx` |
| `/admin/templates` | page | Admin | `src/app/(auth)/admin/templates/page.tsx` |
| `/admin/settings` | page | Admin | `src/app/(auth)/admin/settings/page.tsx` |
| `/admin/plan` | page | Admin | `src/app/(auth)/admin/plan/page.tsx` |
| `/admin/training` | page | Admin | `src/app/(auth)/admin/training/page.tsx` |
| `/admin/content` | page | Admin | `src/app/(auth)/admin/content/page.tsx` |
| `/admin/journey` | page | Admin | `src/app/(auth)/admin/journey/page.tsx` |
| `/admin/operations` | page | Admin | `src/app/(auth)/admin/operations/page.tsx` |
| `/admin/feedback` | page | Admin | `src/app/(auth)/admin/feedback/page.tsx` |
| `/admin/team` | page | Admin | `src/app/(auth)/admin/team/page.tsx` |
| `/admin/users` | page | Admin | `src/app/(auth)/admin/users/page.tsx` |
| `/admin/members` | page | Admin | `src/app/(auth)/admin/members/page.tsx` |
| `/admin/funnels` | page | Admin | `src/app/(auth)/admin/funnels/page.tsx` |
| `/admin/daily-actions` | page | Admin | `src/app/(auth)/admin/daily-actions/page.tsx` |
| `/admin/billing` | page | Admin | `src/app/(auth)/admin/billing/page.tsx` |
| `/admin/beta` | page | Admin | `src/app/(auth)/admin/beta/page.tsx` |
| `/admin/launch-readiness` | page | Admin | `src/app/(auth)/admin/launch-readiness/page.tsx` |
| `/platform-admin` | page | Platform admin | `src/app/(auth)/platform-admin/page.tsx` |
| `/platform-admin/founder` | page | Platform admin | `src/app/(auth)/platform-admin/founder/page.tsx` |
| `/platform-admin/beta` | page | Platform admin | `src/app/(auth)/platform-admin/beta/page.tsx` |
| `/platform-admin/audit-logs` | page | Platform admin | `src/app/(auth)/platform-admin/audit-logs/page.tsx` |
| `/platform-admin/tenant-health` | page | Platform admin | `src/app/(auth)/platform-admin/tenant-health/page.tsx` |
| `/platform-admin/health` | page | Platform admin | `src/app/(auth)/platform-admin/health/page.tsx` |
| `/platform-admin/tenants` | redirect | Platform admin alias | `src/app/(auth)/platform-admin/tenants/page.tsx` |
| `/platform-admin/growth` | page | Platform admin | `src/app/(auth)/platform-admin/growth/page.tsx` |
| `/platform-admin/users` | page | Platform admin | `src/app/(auth)/platform-admin/users/page.tsx` |
| `/platform-admin/ai-profitability` | page | Platform admin | `src/app/(auth)/platform-admin/ai-profitability/page.tsx` |
| `/platform-admin/funnels` | page | Platform admin | `src/app/(auth)/platform-admin/funnels/page.tsx` |
| `/platform-admin/revenue` | page | Platform admin | `src/app/(auth)/platform-admin/revenue/page.tsx` |
| `/platform-admin/ai-usage` | page | Platform admin | `src/app/(auth)/platform-admin/ai-usage/page.tsx` |
| `/platform-admin/billing` | page | Platform admin | `src/app/(auth)/platform-admin/billing/page.tsx` |

### Public Funnel Surfaces

| Route | Type | Domain | Source File |
| --- | --- | --- | --- |
| `/f/[slug]` | dynamic page | Public funnel share URL | `src/app/(public)/f/[slug]/page.tsx` |
| `/[tenant_slug]/funnel/[funnel_slug]` | dynamic page | Public funnel tenant-scoped URL | `src/app/(public)/[tenant_slug]/funnel/[funnel_slug]/page.tsx` |

---

## 2. Domain Route Map

### Auth / Entry

- `/login`
- `/signup`
- `/register` redirecting to `/signup`
- `/pending`
- `/join/[code]`

### Dashboard / Journey

- `/dashboard`
- `/journey`
- `/member`
- `/member/daily-actions`
- `/member/voice`
- `/onboarding`
- `/onboarding/profile`
- `/onboarding/goals`
- `/onboarding/brand`
- `/onboarding/first-content`
- `/onboarding/first-funnel`

### Brand / Content

- `/brand-builder`
- `/brand-builder/profile`
- `/brand-builder/guides`
- `/brand-builder/calendar`
- `/brand-builder/insights`
- `/brand-builder/step/interview`
- `/brand-builder/step/profile`
- `/brand-builder/step/accounts`
- `/brand-builder/step/guides`
- `/brand-builder/step/strategy`
- `/brand-builder/step/calendar`
- `/brand-builder/step/complete`
- `/brand-discovery`
- `/brand-dna`
- `/content-engine`
- `/ai` redirecting to `/content-engine`
- `/ai/coach`
- `/ai/content-plan`
- `/ai/image`
- `/ai/funnel-builder`
- `/ai/brand-builder` redirecting to `/brand-builder`
- `/video`
- `/video/new`
- `/video/[id]`
- `/brand-builder/video-script` redirecting to `/video`

### CRM / Sales / Acquisition

- `/crm`
- `/crm/pipeline`
- `/crm/customers`
- `/crm/[id]`
- `/crm-center`
- `/customers`
- `/sales`
- `/lead-magnet`
- `/funnel`
- `/funnel-builder`
- `/funnel/[id]/edit`
- `/funnel/[id]/analytics`
- `/traffic-engine`
- `/whatsapp-ai`
- `/webinar-center`
- `/automation`
- `/ai-workforce`
- `/saas`
- `/funnel-context`

### Team / Admin / Platform

- `/team`
- `/team/members`
- `/team/growth`
- `/admin`
- `/admin-command`
- `/workspace` redirecting to `/admin`
- `/workspace/[...path]` redirecting to `/admin/[...path]`
- `/admin/*` operational subroutes
- `/platform-admin`
- `/platform-admin/*`
- `/platform-admin/tenants` redirecting to `/platform-admin?tab=tenants`

### Public Funnel Sharing

- `/f/[slug]`
- `/[tenant_slug]/funnel/[funnel_slug]`

---

## 3. Authority Classification

| Route | Classification | Reason |
| --- | --- | --- |
| `/dashboard` | CANONICAL | Primary member landing page and dashboard hub. |
| `/journey` | CANONICAL | Primary journey/progression surface. |
| `/content-engine` | CANONICAL | Main content command center. |
| `/brand-builder` | CANONICAL | Primary brand-building entry point. |
| `/crm` | CANONICAL | Primary CRM navigation surface. |
| `/team` | CANONICAL | Primary team overview. |
| `/admin` | CANONICAL | Primary admin command center. |
| `/platform-admin` | CANONICAL | Primary platform admin hub. |
| `/login` | CANONICAL | Auth entry. |
| `/signup` | CANONICAL | Current registration flow. |
| `/pending` | CANONICAL | Required auth state for approval flow. |
| `/join/[code]` | CANONICAL | Invite join entry. |
| `/f/[slug]` | CANONICAL | Primary public share URL for funnels. |
| `/register` | REDIRECT | Explicit alias to `/signup`. |
| `/ai` | REDIRECT | Explicit alias to `/content-engine`. |
| `/ai/brand-builder` | REDIRECT | Explicit alias to `/brand-builder`. |
| `/brand-builder/video-script` | REDIRECT | Explicit alias to `/video`. |
| `/workspace` | REDIRECT | Admin alias. |
| `/workspace/[...path]` | REDIRECT | Admin alias for nested admin paths. |
| `/platform-admin/tenants` | REDIRECT | Tab alias for platform-admin tenants view. |
| `/crm-center` | DUPLICATE | Live CRM command-center projection, but not the primary nav route. |
| `/admin-command` | DUPLICATE | Live admin command-center projection, but not the primary nav route. |
| `/customers` | LEGACY | Older CRM/conversion surface overlapping the CRM domain. |
| `/team/growth` | LEGACY | Older team-engine surface overlapping canonical `/team`. |
| `/brand-discovery` | LEGACY | Older brand discovery surface now superseded by brand-builder flow. |
| `/brand-dna` | LEGACY | Standalone brand surface that overlaps the brand-builder family. |
| `/[tenant_slug]/funnel/[funnel_slug]` | DUPLICATE | Alternate public funnel surface; `/f/[slug]` is the primary share link. |

---

## 4. Sidebar Route Map

### `src/components/layouts/Sidebar.tsx`

| Label | Route | Classification |
| --- | --- | --- |
| Dashboard | `/dashboard` | CANONICAL |
| Daily Actions | `/member` | CANONICAL |
| AI Coach | `/ai/coach` | CANONICAL |
| Leads | `/crm` | CANONICAL |
| Funnels | `/funnel` | CANONICAL |
| AI Tools | `/ai` | REDIRECT |
| Content Plan | `/ai/content-plan` | CANONICAL |
| AI Image | `/ai/image` | CANONICAL |
| Voice Capture | `/member/voice` | CANONICAL |
| Funnel Builder | `/ai/funnel-builder` | CANONICAL |
| Brand Profile | `/brand-builder/profile` | CANONICAL |
| Content Calendar | `/brand-builder/calendar` | CANONICAL |
| Video Script | `/video` | CANONICAL |
| Content Insights | `/brand-builder/insights` | CANONICAL |
| Platform Guides | `/brand-builder/guides` | CANONICAL |
| Pipeline | `/crm/pipeline` | CANONICAL |
| Customers | `/crm/customers` | CANONICAL |
| Team | `/team` | CANONICAL |
| Team Members | `/team/members` | CANONICAL |
| Approvals | `/admin/approvals` | CANONICAL |
| Admin Command Center | `/admin` | CANONICAL |
| Platform admin items | `/platform-admin/*` | CANONICAL |

### `src/components/layouts/MobileTabBar.tsx`

| Label | Route | Classification |
| --- | --- | --- |
| Dashboard | `/dashboard` | CANONICAL |
| Journey | `/journey` | CANONICAL |
| Growth | `/content-engine` | CANONICAL |
| Leads | `/crm` | CANONICAL |
| Settings | `/settings` | CANONICAL |

### `src/modules/mission/constants/sidebar-config.ts`

| Label | Route | Classification |
| --- | --- | --- |
| Dashboard | `/dashboard` | CANONICAL |
| Journey Map | `/journey` | CANONICAL |
| Content Engine | `/content-engine` | CANONICAL |
| AI Tools | `/ai` | REDIRECT |
| Video Studio | `/video` | CANONICAL |
| Lead Engine | `/leads` | CANONICAL |
| Funnels | `/funnel` | CANONICAL |
| CRM Engine | `/customers` | LEGACY |
| Sales Engine | `/sales` | CANONICAL |
| Brand Profile | `/brand-builder/profile` | CANONICAL |
| Restart Interview | `/brand-builder/step/interview` | CANONICAL |
| Setup Guides | `/brand-builder/guides` | CANONICAL |
| Content Calendar | `/brand-builder/calendar` | CANONICAL |
| Content Analytics | `/brand-builder/insights` | CANONICAL |
| Lead List | `/crm` | CANONICAL |
| Pipeline | `/crm/pipeline` | CANONICAL |
| Team Growth | `/team/growth` | LEGACY |
| Analytics | `/analytics` | CANONICAL |
| Training | `/member?view=training` | CANONICAL |
| Daily Actions | `/member/daily-actions` | CANONICAL |
| Achievements | `/journey` | CANONICAL |
| Settings | `/settings` | CANONICAL |

---

## 5. Dashboard Route Map

### `DashboardV4`

- CTA routes to `nextAction.route`
- This is canonical as long as `nextAction.route` resolves into canonical surfaces

### `QuickLaunchGrid`

- `/brand-builder/step/interview`
- `/brand-builder/step/profile`
- `/brand-builder/step/guides`
- `/ai`
- `/video/new`
- `/funnel`
- `/crm`
- `/crm/pipeline`

### `BrandBuilderWidget`

- `/brand-builder`
- `/brand-builder/calendar`
- `/ai`

### `GrowthModeDashboard`

- `/ai`
- `/ai/content-plan`
- `/crm`

### `BeginnerJourneyView`

- `action.route` is the primary journey CTA target

### Assessment

Dashboard and journey CTAs are mostly canonical, but some quick-launch paths still point to redirect aliases such as `/ai`.

---

## 6. Duplicate Route Analysis

### CRM Duplicates

- `/crm` is the canonical CRUD CRM surface.
- `/crm-center` is a parallel command-center projection.
- `/customers` is the legacy CRM engine surface.

Overlap:

- all three address the same business domain
- `/crm` is the default sidebar path
- `/crm-center` is used by AI recommendations and command-center patterns
- `/customers` still exists for legacy flows and deep links

### Sales Duplicates

- `/sales` is the live sales surface.
- Related CRM paths such as `/crm/pipeline` overlap in business meaning, but they are not the same UI surface.

### Team Duplicates

- `/team` is canonical.
- `/team/members` is a valid subpage.
- `/team/growth` is a legacy team-engine surface.

### Content Duplicates

- `/content-engine` is canonical.
- `/ai` is a redirect alias.
- `/brand-builder/calendar` is a content-calendar projection, not a duplicate of the command center.

### AI Duplicates

- `/ai` is only a hub alias.
- `/ai/coach`, `/ai/content-plan`, `/ai/image`, and `/ai/funnel-builder` are distinct tool pages.

### Journey Duplicates

- `/journey` is canonical.
- `/dashboard` contains journey CTA content, but not the journey surface itself.

---

## 7. Deep Link Risk

| Route | Risk | Why |
| --- | --- | --- |
| `/dashboard` | HIGH | Primary landing page, likely bookmarked and linked everywhere. |
| `/journey` | HIGH | Core progression surface, likely deep-linked from onboarding and docs. |
| `/content-engine` | HIGH | Main content hub and CTA target from dashboards. |
| `/brand-builder` | HIGH | Entry point from onboarding and brand flow. |
| `/crm` | HIGH | Main CRM surface and sidebar route. |
| `/team` | HIGH | Main team route and sidebar route. |
| `/admin` | HIGH | Admin entry point, often linked from internal tooling. |
| `/platform-admin` | HIGH | Platform admin hub. |
| `/login` | HIGH | Public entry route. |
| `/signup` | HIGH | Public registration route. |
| `/join/[code]` | HIGH | Invite links can be shared externally. |
| `/f/[slug]` | HIGH | Public funnel link, intended for external traffic. |
| `/[tenant_slug]/funnel/[funnel_slug]` | HIGH | Public funnel route, likely to appear in old bookmarks and tenant-specific links. |
| `/crm-center` | MEDIUM | AI and internal links can still target it, but it is not the primary sidebar route. |
| `/admin-command` | MEDIUM | Internal command center; lower external exposure than `/admin`. |
| `/customers` | MEDIUM | Legacy route, but still a plausible bookmark target. |
| `/team/growth` | MEDIUM | Legacy route, still a plausible bookmark target. |
| `/brand-discovery` | MEDIUM | Legacy route, may survive in older onboarding links. |
| `/brand-dna` | MEDIUM | Legacy route with historical brand links. |
| `/workspace` | MEDIUM | Admin alias, mostly internal but can be bookmarked. |
| `/workspace/[...path]` | MEDIUM | Deep admin alias, used by historical paths. |
| `/register` | LOW | Redirect-only alias, safe if retained. |
| `/ai` | LOW | Redirect-only alias, safe if retained. |
| `/ai/brand-builder` | LOW | Redirect-only alias, safe if retained. |
| `/brand-builder/video-script` | LOW | Redirect-only alias, safe if retained. |
| `/platform-admin/tenants` | LOW | Tab alias, safe if retained. |

---

## 8. Recommended Route Authority Matrix

| Domain | Canonical Route | Legacy Route | Recommendation |
| --- | --- | --- | --- |
| Auth | `/login`, `/signup` | `/register` | Keep redirect alias only |
| Dashboard | `/dashboard` | none | Keep canonical |
| Journey | `/journey` | none | Keep canonical |
| Content | `/content-engine` | `/ai` | Keep redirect alias only |
| Brand | `/brand-builder` | `/brand-discovery`, `/brand-dna`, `/ai/brand-builder`, `/brand-builder/video-script` | Keep canonical plus aliases |
| CRM | `/crm` | `/crm-center`, `/customers` | Keep canonical plus aliases until traffic drops |
| Sales | `/sales` | none | Keep canonical |
| Team | `/team` | `/team/growth` | Keep canonical plus alias until traffic drops |
| Admin | `/admin` | `/workspace`, `/workspace/[...path]`, `/admin-command` | Keep canonical plus aliases |
| Platform admin | `/platform-admin` | `/platform-admin/tenants` | Keep canonical plus alias |
| Funnels | `/f/[slug]` | `/[tenant_slug]/funnel/[funnel_slug]` | Keep both; global share URL should be preferred |

---

## 9. Deletion Readiness Matrix

| Route | Readiness | Reason |
| --- | --- | --- |
| `/register` | READY | Pure redirect alias to `/signup`. |
| `/ai` | READY | Pure redirect alias to `/content-engine`. |
| `/ai/brand-builder` | READY | Pure redirect alias to `/brand-builder`. |
| `/brand-builder/video-script` | READY | Pure redirect alias to `/video`. |
| `/workspace` | READY | Pure admin alias. |
| `/workspace/[...path]` | READY | Pure admin alias. |
| `/platform-admin/tenants` | READY | Pure tab alias. |
| `/customers` | PARTIAL | Still reachable from sidebar and old deep links; needs traffic check before removal. |
| `/crm-center` | PARTIAL | Used by AI recommendations and CRM command-center flows. |
| `/admin-command` | PARTIAL | Still a live command center surface. |
| `/team/growth` | PARTIAL | Legacy team engine, still a plausible bookmark target. |
| `/brand-discovery` | PARTIAL | Legacy brand flow with historical use. |
| `/brand-dna` | PARTIAL | Legacy brand surface with historical use. |
| `/[tenant_slug]/funnel/[funnel_slug]` | PARTIAL | Alternate public funnel surface; keep for backward compatibility until share-link telemetry is understood. |

Nothing in this audit is BLOCKED for deletion except the active canonical routes themselves and the public funnel surfaces.

---

## 10. Final Recommendation

Use a single canonical route per domain in navigation and quick actions:

- `/dashboard`
- `/journey`
- `/content-engine`
- `/brand-builder`
- `/crm`
- `/team`
- `/admin`
- `/platform-admin`

Keep redirect aliases only for old bookmarks, AI-generated links, and historical URLs.

The next consolidation step should be:

1. Keep the canonical routes as the only surfaced destinations in navigation.
2. Leave redirect aliases in place until telemetry shows they are cold.
3. Remove duplicate secondary surfaces only after link and bookmark risk is low.

The route model is better than before, but still has enough overlap that an automatic deletion pass would be too aggressive without traffic data.
