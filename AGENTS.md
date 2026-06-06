# NextShift Project Instructions

## Project Goal

Build NextShift as an AI-guided personal brand, funnel, content, and CRM system for new online business users.

## Tech Stack

- Frontend: Next.js / React
- Styling: Tailwind CSS
- Backend: Supabase
- Auth: Supabase Auth
- AI: OpenAI / Claude API
- Deployment: Vercel

## Main Rules

- Do not break existing pages.
- Always check current file structure before editing.
- Prefer reusable components.
- Keep UI clean, modern, mobile-first.
- Use Chinese and English copy where needed.
- Support Chinese, English, and Bahasa Malaysia for Malaysia-facing user experiences.
- Never expose API keys.
- Do not delete files unless explicitly asked.

## Architecture-First Rule

Before executing any skill, check the `architecture_refs` field in its SKILL.md frontmatter and read those architecture docs first. Architecture docs are the source of truth for database schema, API design, module structure, and technical constraints.

Architecture docs location: `docs/architecture/`

## Language Policy

NextShift should support three languages by default:

- Chinese
- English
- Bahasa Malaysia

Default behavior:

- Internal instructions: English
- User-facing copy: Chinese + English when needed
- Malaysia-facing copy: Chinese + English + Bahasa Malaysia when needed

## Important Folders

- `/app` = main application pages
- `/components` = reusable UI
- `/lib` = helper functions
- `/skills` = AI skill instructions
- `/prompts` = prompt templates
- `/admin` = admin dashboard logic
- `/docs/architecture` = system architecture (source of truth)

## Test Commands

Before finishing, run:

- `npm run lint`
- `npm run build`

## Output Requirement

After every task, summarize:

1. Files changed
2. What was added
3. What still needs improvement

## Skills Policy

All AI skills are stored in `/skills`.

Before solving strategy, UX, funnel, content, or AI Coach tasks, check the relevant file under `/skills` and follow its `SKILL.md`.

Do not create duplicate skill folders.

Before creating a new skill, check whether an existing skill can be extended.

Each skill folder must include:

- `SKILL.md` (with `architecture_refs` in frontmatter when applicable)
- `examples.md` (real input→output examples, not templates)
- `checklist.md` (skill-specific quality checks)

Skill categories:

- `core`
- `ux`
- `growth`
- `crm`
- `ai`
- `data`
- `verticals`

## Core Skills (5)

Core is responsible for the overall product, system, UI, AI assistant, and business operating architecture that coordinates all other categories.

- `business-operating-system-architect` — cross-functional OS coordination + growth engine
- `nextshift-os-architect` — CTO-level SaaS architecture
- `ai-model-router` — AI model selection policy
- `design-system-architect` — visual system + component library + design tokens *(merged from ui-system-architect + design-system-manager)*
- `ai-assistant-designer` — proactive AI Coach experience design

## Growth Skills (7)

Growth is responsible for the journey before and through initial conversion:

```text
Traffic → Lead → Conversion
```

- `personal-brand` — positioning + niche + bios + brand audit *(merged from identity-builder + personal-brand-audit)*
- `content-engine` — 90-day content plans, 40/20/20/10/10 ratio
- `offer-architect` — Hormozi value framework offers
- `funnel-builder` — complete funnels + lead magnets + webinars *(absorbs lead-magnet-builder + webinar-builder)*
- `conversion-optimizer` — 0-100 conversion scoring
- `whatsapp-closer` — WhatsApp sales + objection handling *(absorbs objection-handler)*
- `retention-marketer` — post-purchase retention marketing

## CRM Skills (9)

CRM is responsible for managing leads, pipeline, customers, teams, follow-up, retention, and reporting after leads enter the system:

```text
Lead → Pipeline → Customer → Retention → Team / Analytics
```

- `crm-architect`
- `lead-management`
- `pipeline-management`
- `customer-journey`
- `distributor-management`
- `team-duplication`
- `retention-system`
- `analytics-dashboard`
- `crm-uiux`

## AI Skills (7)

AI is responsible for intelligent generation, automation, scoring, orchestration, and proactive coaching:

```text
Input → AI Reasoning / Generation → Review → Automation / Action → Learning Loop
```

- `ai-lead-scoring`
- `whatsapp-automation`
- `email-automation`
- `ai-content-generator`
- `ai-funnel-generator` — funnel + landing page AI generation *(absorbs ai-landingpage-builder)*
- `ai-agent-orchestrator`
- `ai-coach`

## Data Skills (5)

Data is responsible for structures and logic that make CRM, funnels, AI Coach, dashboards, analytics, and reporting measurable:

```text
Database → Events → Analytics → Reports → Warehouse
```

- `crm-database`
- `analytics-engine`
- `event-tracking`
- `reporting-engine`
- `data-warehouse`

## UX Skills (6)

- `dashboard-ux-designer`
- `mobile-first-designer`
- `onboarding-designer`
- `ux-flow-architect`
- `visual-hierarchy-expert`
- `accessibility-auditor`

## Verticals Skills (3)

- `health-funnel-builder`
- `herbalife-retail-system`
- `ai-video-engine` — AI video creative packages *(replaces ai-video-script-generator)*

## Merge Log

| Merged Into | Absorbed Skills | Date |
|-------------|----------------|------|
| core/design-system-architect | core/ui-system-architect + core/design-system-manager | 2026-06-06 |
| growth/personal-brand | growth/identity-builder + growth/personal-brand-audit | 2026-06-06 |
| growth/funnel-builder | growth/lead-magnet-builder + growth/webinar-builder | 2026-06-06 |
| growth/whatsapp-closer | growth/objection-handler | 2026-06-06 |
| ai/ai-funnel-generator | ai/ai-landingpage-builder | 2026-06-06 |
| core/business-operating-system-architect | verticals/growth-engine | 2026-06-06 |
| verticals/ai-video-engine | *(kept; ai/ai-video-script-generator deleted)* | 2026-06-06 |
