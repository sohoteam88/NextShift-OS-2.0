# 04 — Module Architecture

## Purpose

Define every module in NextShift OS, its responsibilities, boundaries, and inter-module dependencies.

## Scope

Module decomposition and dependency map. For individual module detail, see docs 10–16.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module pattern | Feature-based folders in monorepo | Co-locate related code, easy to navigate |
| Inter-module communication | Direct function calls (same process) | Monolith — no need for message queues yet |
| Shared code | `shared/` directory for utils, types, i18n | Avoid duplication, single source for common logic |
| Module isolation | Each module owns its Prisma models, API routes, and UI components | Clear ownership, prevents cross-contamination |

## Module Map

```
src/
├── modules/
│   ├── auth/           ← Authentication, sessions, tenant resolution
│   ├── tenant/         ← Tenant CRUD, settings, subscription
│   ├── crm/            ← Leads, pipeline, scoring, tags, notes, timeline
│   ├── funnel/         ← Landing pages, quizzes, lead magnets, templates
│   ├── ai/             ← Provider adapter, content gen, analysis, coaching
│   ├── automation/     ← WhatsApp sequences, reminders, webhooks, n8n
│   ├── member/         ← Onboarding, daily OS, training, progress
│   ├── team/           ← Sponsor tree, downline, duplication, performance
│   ├── admin/          ← User management, template management, settings
│   ├── analytics/      ← Event tracking, dashboards, reports
│   ├── voice/          ← Voice upload, STT, AI extraction, profile save
│   └── i18n/           ← Translation files, language switching, AI output lang
├── shared/
│   ├── types/          ← Shared TypeScript interfaces
│   ├── utils/          ← Date, currency, phone formatting
│   ├── ui/             ← Design system components
│   ├── hooks/          ← Shared React hooks
│   └── middleware/     ← Auth, tenant, rate limiting middleware
└── prisma/
    └── schema.prisma   ← Single schema, models organized by module comments
```

## Module Dependency Matrix

| Module | Depends On | Used By |
|--------|-----------|---------|
| auth | — | ALL |
| tenant | auth | ALL |
| crm | auth, tenant, i18n | funnel, automation, ai, analytics, voice |
| funnel | auth, tenant, crm, ai, i18n | analytics |
| ai | auth, tenant | crm, funnel, automation, member, voice |
| automation | auth, tenant, crm, ai | analytics |
| member | auth, tenant, crm, ai, i18n | team, analytics |
| team | auth, tenant, member | admin, analytics |
| admin | auth, tenant | — (top-level) |
| analytics | auth, tenant | admin |
| voice | auth, tenant, crm, ai | member |
| i18n | — | ALL user-facing modules |

## Module Responsibilities

### auth
- Login / logout / signup
- Session management (JWT or Supabase session)
- Password reset
- Tenant resolution from subdomain or URL

### tenant
- Tenant CRUD (create, read, update)
- Tenant settings (pipeline stages, tag presets, branding)
- Subscription plan enforcement (member limits, AI quotas)

### crm
- Lead CRUD with tenant scoping
- Pipeline management (drag-and-drop stage changes)
- Lead scoring (rule-based + AI-assisted)
- Tags, notes, activity log
- Follow-up reminders
- Customer journey timeline
- See `10_CRM_ARCHITECTURE.md`

### funnel
- Funnel template library (operator-managed)
- Funnel builder (drag-and-drop or form-based)
- Public funnel page rendering (SSR for SEO)
- Quiz / assessment engine
- Lead magnet delivery
- WhatsApp CTA integration
- See `11_FUNNEL_ARCHITECTURE.md`

### ai
- AI provider adapter (OpenAI ↔ Anthropic)
- Content generation (social posts, captions)
- Funnel copy generation (headlines, body, CTA)
- Lead analysis (score prediction, next-action suggestion)
- WhatsApp reply suggestion
- AI coaching (what to do today, how to improve)
- Voice-to-profile extraction
- Prompt template management
- See `09_AI_ARCHITECTURE.md`

### automation
- WhatsApp message sending (single + sequence)
- Follow-up reminder scheduling
- Webhook handling (inbound from WhatsApp, n8n)
- Drip campaign engine
- See `12_AUTOMATION_ARCHITECTURE.md`

### member
- New member onboarding checklist
- Daily action plan (Daily OS)
- Content task assignments
- Funnel creation progress
- Training module progress tracking

### team
- Sponsor relationship management
- Downline tree visualization
- Team activity feed
- Leader dashboard (sub-team metrics)
- Member performance tracking

### admin
- Approve / reject new member registrations
- Manage users (edit roles, deactivate)
- Manage funnel templates
- Manage AI prompt templates
- Configure CRM settings (pipeline, tags)
- View cross-tenant analytics (platform admin only)

### analytics
- Event tracking (page views, funnel conversions, lead actions)
- Member activity metrics (daily action completion rate)
- Team performance dashboards
- Lead conversion funnel analytics
- See `13_ANALYTICS_ARCHITECTURE.md`

### voice
- Voice file upload (audio recording in browser)
- Speech-to-text via Whisper API
- AI extraction (profile, pain points, goals, story angle, content pillars)
- Save extracted data to CRM lead or member profile
- See `16_VOICE_CAPTURE_ARCHITECTURE.md`

### i18n
- Translation file management (JSON per language)
- Language switcher component
- AI output language control (generate content in user's preferred language)
- Date, number, currency formatting per locale
- See `15_I18N_ARCHITECTURE.md`

## Data Flow

```
[User Action] → [Module API Route] → [Module Service Layer] → [Prisma] → [PostgreSQL]
                                           │
                                           ├──▶ [AI Module] (if AI needed)
                                           ├──▶ [Automation Module] (if trigger fires)
                                           └──▶ [Analytics Module] (event tracked)
```

## Technical Considerations

- Every module exposes its functionality through a **service layer** (not direct DB access from routes)
- Cross-module calls go through service imports, never direct Prisma queries on another module's models
- Each module has its own `/api/` route namespace: `/api/crm/`, `/api/funnel/`, etc.
- UI components are co-located: `modules/crm/components/`, `modules/crm/pages/`

## Future Expansion

- Extract high-traffic modules (analytics, AI) into separate services if needed
- Plugin system for operator-specific customizations
- Marketplace module for template and prompt pack distribution

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Module boundaries blur over time | Enforce via code review, lint rules, dependency checks |
| Shared code becomes dumping ground | Strict criteria: must be used by 3+ modules to enter shared/ |
| Circular dependencies | Dependency matrix review on every new cross-module import |
