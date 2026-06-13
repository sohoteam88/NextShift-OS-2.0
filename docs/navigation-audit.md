# Navigation Audit

## Goal

Move NextShift OS from feature-centric navigation to journey-centric navigation.

Users should answer one question first: what is my next step?

## Route Inventory

### Primary Journey Routes

- `/dashboard`
- `/journey`
- `/content-engine`
- `/crm`
- `/analytics-center`
- `/team`
- `/settings`

### Foundation And Brand

- `/brand-discovery`
- `/brand-dna`
- `/social-setup`
- `/brand-builder`
- `/brand-builder/profile`
- `/brand-builder/calendar`
- `/brand-builder/insights`
- `/brand-builder/guides`
- `/brand-builder/step/interview`
- `/brand-builder/step/profile`
- `/brand-builder/step/strategy`
- `/brand-builder/step/accounts`
- `/brand-builder/step/calendar`
- `/brand-builder/step/guides`
- `/brand-builder/step/complete`

### Growth And Content

- `/content-engine`
- `/video-production`
- `/video`
- `/video/new`
- `/ai`
- `/ai/coach`
- `/ai/content-plan`
- `/ai/image`
- `/ai/funnel-builder`
- `/ai/brand-builder`

### Lead Generation

- `/lead-magnet`
- `/funnel`
- `/funnel-builder`
- `/funnel-context`
- `/funnel/[id]/edit`
- `/funnel/[id]/analytics`
- `/traffic-engine`
- `/webinar-center`

### Leads And Conversion

- `/crm`
- `/crm/pipeline`
- `/crm/customers`
- `/crm-center`
- `/whatsapp-ai`

### Business And Scale

- `/analytics`
- `/analytics-center`
- `/automation`
- `/ai-workforce`
- `/blueprints`
- `/billing`
- `/franchise`
- `/ceo-mode`
- `/localization`
- `/saas`

### Team And Admin

- `/team`
- `/team/members`
- `/admin`
- `/admin/users`
- `/admin/approvals`
- `/admin/daily-actions`
- `/admin/training`
- `/admin/templates`
- `/admin/ai-templates`
- `/admin/plan`
- `/admin/settings`
- `/admin-command`

### Platform Admin

- `/platform-admin`
- `/platform-admin/health`
- `/platform-admin/tenants`
- `/platform-admin/users`
- `/platform-admin/billing`
- `/platform-admin/ai-usage`
- `/platform-admin/audit-logs`

### Onboarding And Public

- `/onboarding`
- `/onboarding/profile`
- `/onboarding/goals`
- `/onboarding/brand`
- `/onboarding/first-content`
- `/onboarding/first-funnel`
- `/onboarding/complete`
- `/login`
- `/signup`
- `/register`
- `/pending`
- `/join/[code]`
- `/f/[slug]`
- `/[tenant_slug]/funnel/[funnel_slug]`

## Duplicate Or Overlapping UX

### Video

- `/video`
- `/video-production`
- `/brand-builder/video-script`

Recommendation: make `/video-production` the journey-facing module and keep `/video` as the project workspace. Redirect or hide `/brand-builder/video-script`.

### Funnel

- `/funnel`
- `/funnel-builder`
- `/funnel-context`
- `/ai/funnel-builder`

Recommendation: expose only one journey entry under Lead Generation. Keep deeper routes contextual from that screen.

### CRM

- `/crm`
- `/crm-center`
- `/crm/pipeline`
- `/crm/customers`

Recommendation: expose `/crm` as Leads. Pipeline and Customers should be secondary tabs inside the CRM experience.

### Analytics

- `/analytics`
- `/analytics-center`
- `/platform-admin/ai-usage`

Recommendation: use `/analytics-center` as Business analytics for users. Keep platform cost views inside Platform Admin only.

### Brand

- `/brand-builder/profile`
- `/brand-discovery`
- `/brand-dna`
- `/brand-builder/step/*`

Recommendation: Journey Phase 1 owns the sequence. Individual routes remain accessible from the phase screen, not from global navigation.

## Hidden Dependencies

- Content quality depends on Brand DNA being completed first.
- Video and funnel generation depend on brand profile and content pillars.
- Lead conversion depends on CRM stages and WhatsApp follow-up being configured.
- Dashboard recommendations depend on mission state, CRM data, content calendar, and brand score.
- Platform admin routes should stay role-protected and should not appear in member navigation.

## Unnecessary Global Navigation Items

These should not be top-level global items:

- AI Tools
- Video Production
- Content Plan
- Funnel Context
- Blueprint
- Franchise
- CEO Mode
- Localization
- SaaS
- Admin sub-pages
- Platform admin sub-pages

They should be reachable only through Journey phases, Business, Team, or Settings.

## New Information Architecture

Top navigation only:

- Dashboard: daily operating center
- Journey: primary next-step screen
- Growth: content, video, lead generation tools
- Leads: CRM and follow-up
- Business: analytics, admin, billing, system controls
- Team: members, approvals, team progress
- Settings: personal and tenant configuration

## Implementation Notes

- Desktop AppShell now uses a compact top navigation instead of the long feature sidebar.
- Mobile uses five core tabs: Dashboard, Journey, Growth, Leads, Settings.
- Dashboard has been reframed as a Daily Operating Center.
- Journey has been reframed around five phases: Foundation, Audience Building, Lead Generation, Conversion, Scale.
