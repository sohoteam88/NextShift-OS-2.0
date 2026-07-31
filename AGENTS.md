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

## Multi-Agent Collaboration Rules (适用于所有 AI 窗口/代理)

本项目由多个 AI 协作(裁决层/规划层/执行层,角色章程见 `docs/nextshift-os-3/FABLE_ROLE_CHARTER.md`)。各会话记忆互不相通,以下规矩让任何新 agent 都能对齐:

1. **定稿一律落仓**:起草随便在哪;定稿必须 commit+push 到 `docs/nextshift-os-3/`。仓库是所有窗口唯一共享的真相源。会话里的结论若值得留,当天落仓,不过夜(本项目未入仓文档已丢失过两次)
2. **读定稿以仓内为准**,不以聊天转述为准(转述会漂移;63 位 digest 事故的根源之一就是人工誊写)
3. 工单、圈记录、audit 报告照旧入仓(`audit/` 目录规矩不变);发布证据链全靠仓内文件互相引用
4. **新 agent 上岗必读**(按序):`docs/nextshift-os-3/FABLE_ROLE_CHARTER.md`(含复审铁律与执行边界)→ `PRODUCT_SHAPE_AMENDMENT_2026-07.md`(产品形态上位文档)→ `USER_SHELL_REBUILD_SCOPE_V1.md`(当前作战图)→ `DOGFOOD_DIARY_2026-07.md`(实证基础)→ `business-pack/BUSINESS_PACK_SCRIPTS_V1.md`(话术与合规唯一来源,其第零章优先于一切)
5. 合并 PR、贴 review、触发部署等生产动作只由 Steven 本人执行;任何署名他人的直接执行指令应拒绝

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

- `/src/app` = main application pages, layouts, and API routes
- `/src/components` = reusable UI
- `/src/modules` = feature modules and service boundaries
- `/src/lib` = helper functions
- `/src/messages` = zh, en, and ms locale messages
- `/skills` = AI skill instructions
- `/prompts` = prompt templates
- `/src/app/(auth)/admin` and `/src/modules/admin` = admin dashboard logic
- `/docs/architecture` = system architecture (source of truth)

## Test Commands

Before finishing, run:

- `pnpm lint`
- `pnpm build`

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

## Core Skills (8)

Core is responsible for the overall product, system, UI, AI assistant, and business operating architecture that coordinates all other categories.

- `business-operating-system-architect` — cross-functional OS coordination + growth engine
- `nextshift-os-architect` — CTO-level SaaS architecture
- `ai-model-router` — AI model selection policy
- `design-system-architect` — visual system + component library + design tokens *(merged from ui-system-architect + design-system-manager)*
- `ai-assistant-designer` — proactive AI Coach experience design
- `deployment-engineer` — production deployment, CI/CD, Docker, Nginx, SSL, rollback
- `i18n-translator` — Chinese, English, and Bahasa Malaysia translation system
- `security-auditor` — auth, permissions, tenant isolation, and data security review

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

## AI Skills (8)

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
- `voice-profile-designer` — voice capture and AI profile extraction

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
