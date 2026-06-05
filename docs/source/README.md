# NextShift OS — System Architecture

## What is this folder?

This is the **single source of truth** for the entire NextShift OS system. Every design decision, data model, module boundary, and engineering standard lives here. No code should be written without first consulting the relevant architecture document.

## How to use

### For AI Coworkers (Claude Code / Codex / Copilot)

1. **Before ANY coding task**, read these files in order:
   - `00_SYSTEM_OVERVIEW.md` — understand what NextShift OS is
   - `04_MODULE_ARCHITECTURE.md` — find which module your task belongs to
   - The specific module doc (e.g., `10_CRM_ARCHITECTURE.md`)
   - `19_ENGINEERING_STANDARDS.md` — coding conventions
   - `AGENTS.md` (root) — operating rules

2. **Before touching the database**, read `07_DATABASE_ARCHITECTURE.md`
3. **Before creating UI**, read `14_UI_UX_ARCHITECTURE.md`
4. **Before adding AI prompts**, read `09_AI_ARCHITECTURE.md`
5. **Before adding any user-facing string**, read `15_I18N_ARCHITECTURE.md`

### For Human Developers

Read `00_SYSTEM_OVERVIEW.md` first, then the module relevant to your task.

## Source of Truth Hierarchy

| Priority | Document | Governs |
|----------|----------|---------|
| 1 | `05_USER_ROLES_AND_PERMISSIONS.md` | Who can do what |
| 2 | `07_DATABASE_ARCHITECTURE.md` | All data models |
| 3 | `08_API_ARCHITECTURE.md` | All endpoints |
| 4 | `04_MODULE_ARCHITECTURE.md` | Module boundaries |
| 5 | `19_ENGINEERING_STANDARDS.md` | How code is written |

## Preventing Architecture Drift

- **Never** add a table without updating `07_DATABASE_ARCHITECTURE.md`
- **Never** add an endpoint without updating `08_API_ARCHITECTURE.md`
- **Never** add a module without updating `04_MODULE_ARCHITECTURE.md`
- **Never** add a role/permission without updating `05_USER_ROLES_AND_PERMISSIONS.md`
- **Every PR** must reference which architecture doc was consulted
- If a doc is outdated, update the doc **first**, then write code

## File Index

| # | File | Topic |
|---|------|-------|
| 00 | SYSTEM_OVERVIEW | High-level system description |
| 01 | PRODUCT_VISION | Why this product exists, who it serves |
| 02 | SYSTEM_CONTEXT | External systems, integrations |
| 03 | DOMAIN_MODEL | Core domain entities and relationships |
| 04 | MODULE_ARCHITECTURE | Module boundaries and dependencies |
| 05 | USER_ROLES_AND_PERMISSIONS | RBAC model |
| 06 | MULTI_TENANT_ARCHITECTURE | Tenant isolation, data boundaries |
| 07 | DATABASE_ARCHITECTURE | Schema, tables, migrations |
| 08 | API_ARCHITECTURE | REST endpoints, auth, rate limiting |
| 09 | AI_ARCHITECTURE | AI providers, prompts, fallback |
| 10 | CRM_ARCHITECTURE | Leads, pipeline, scoring, follow-up |
| 11 | FUNNEL_ARCHITECTURE | Landing pages, quizzes, CTAs |
| 12 | AUTOMATION_ARCHITECTURE | n8n, webhooks, scheduled tasks |
| 13 | ANALYTICS_ARCHITECTURE | Dashboards, metrics, events |
| 14 | UI_UX_ARCHITECTURE | Design system, components, layouts |
| 15 | I18N_ARCHITECTURE | zh/en/ms translation system |
| 16 | VOICE_CAPTURE_ARCHITECTURE | Voice-to-profile pipeline |
| 17 | SECURITY_ARCHITECTURE | Auth, encryption, compliance |
| 18 | DEPLOYMENT_ARCHITECTURE | VPS, Docker, CI/CD |
| 19 | ENGINEERING_STANDARDS | Code style, testing, Git workflow |
| 20 | DEVELOPMENT_ROADMAP | Phases, milestones, priorities |
| 21 | AI_COWORKER_RULES | Rules for AI-assisted development |
