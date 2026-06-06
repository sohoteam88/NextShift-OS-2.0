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

## Language Policy

NextShift should support three languages by default:

- Chinese
- English
- Bahasa Malaysia

For user-facing UI copy, funnels, onboarding, CRM messages, WhatsApp, email, and AI Coach scripts, provide multilingual copy when requested or when serving Malaysia users.

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

- `SKILL.md`
- `examples.md`
- `checklist.md`

Skill categories:

- `core`
- `ux`
- `growth`
- `crm`
- `ai`
- `data`
- `verticals`

Core skills:

Core is responsible for the overall product, system, UI, AI assistant, and business operating architecture that coordinates all other categories.

- `business-operating-system-architect`
- `nextshift-os-architect`
- `ai-model-router`
- `ui-system-architect`
- `design-system-manager`
- `ai-assistant-designer`

Growth skills:

Growth is responsible for the journey before and through initial conversion:

```text
Traffic
↓
Lead
↓
Conversion
```

Use growth skills for positioning, content, offers, funnels, lead magnets, webinars, WhatsApp conversion, objection handling, conversion optimization, and retention marketing.

- `identity-builder`
- `personal-brand-audit`
- `content-engine`
- `offer-architect`
- `funnel-builder`
- `lead-magnet-builder`
- `conversion-optimizer`
- `webinar-builder`
- `whatsapp-closer`
- `objection-handler`
- `retention-marketer`

CRM skills:

CRM is responsible for managing leads, pipeline, customers, teams, follow-up, retention, and reporting after leads enter the system:

```text
Lead
↓
Pipeline
↓
Customer
↓
Retention
↓
Team / Analytics
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

AI skills:

AI is responsible for intelligent generation, automation, scoring, orchestration, and proactive coaching across growth, CRM, content, funnel, WhatsApp, email, video, and user guidance:

```text
Input
↓
AI Reasoning / Generation
↓
Review
↓
Automation / Action
↓
Learning Loop
```

- `ai-lead-scoring`
- `whatsapp-automation`
- `email-automation`
- `ai-content-generator`
- `ai-funnel-generator`
- `ai-landingpage-builder`
- `ai-video-script-generator`
- `ai-agent-orchestrator`
- `ai-coach`

Data skills:

Data is responsible for the structures and logic that make CRM, funnels, AI Coach, dashboards, analytics, and reporting measurable:

```text
Database
↓
Events
↓
Analytics
↓
Reports
↓
Warehouse
```

Future database, analytics, and warehouse work belongs here, including Supabase, PostgreSQL, and BigQuery.

- `crm-database`
- `analytics-engine`
- `event-tracking`
- `reporting-engine`
- `data-warehouse`
