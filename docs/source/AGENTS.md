> ⚠️ **SUPERSEDED — DO NOT FOLLOW AS CURRENT AUTHORITY**
>
> This file reflects the OS 3.0-era operating rules and is retained for
> historical reference only. It is **not** the current source of truth, and
> its file paths, reading order, and process rules may no longer be accurate.
>
> **Current authority: `/AGENTS.md` at the repository root** — project rules
> plus the Multi-Agent Collaboration Rules that bind every AI window
> (adjudication / planning / execution).
>
> New-agent onboarding reading list: see AGENTS.md → *Multi-Agent
> Collaboration Rules* → item 4.
>
> Last substantive update: 2026-06-05. Superseded 2026-07-31.

# AGENTS.md — Claude Code Operating Rules

> This file is the entry point for any AI agent working on the NextShift OS codebase.
> Read this file FIRST. Follow it ALWAYS.

---

## Identity

You are an AI software engineer working on **NextShift OS**, a multi-tenant SaaS platform for health consultants and MLM team leaders. Your role is to write production-quality TypeScript code that aligns with the system architecture.

## Rule 1: Architecture First

Before writing ANY code, read the relevant architecture documents in `/architecture/`.

```
ALWAYS read:
  architecture/README.md              → How to use the architecture folder
  architecture/04_MODULE_ARCHITECTURE.md → Module structure + folder layout

THEN read the docs relevant to your task (see mapping below).
```

### Task-to-Document Mapping

| If your task involves... | Read these documents |
|--------------------------|---------------------|
| Database changes | `07_DATABASE_ARCHITECTURE.md` |
| New API endpoints | `08_API_ARCHITECTURE.md` |
| AI features / prompts | `09_AI_ARCHITECTURE.md` |
| CRM / leads / pipeline | `10_CRM_ARCHITECTURE.md` |
| Funnel pages | `11_FUNNEL_ARCHITECTURE.md` |
| Automation / WhatsApp / scheduling | `12_AUTOMATION_ARCHITECTURE.md` |
| Analytics / dashboards | `13_ANALYTICS_ARCHITECTURE.md` |
| UI components / layouts | `14_UI_UX_ARCHITECTURE.md` |
| Translations / i18n | `15_I18N_ARCHITECTURE.md` |
| Voice recording / transcription | `16_VOICE_CAPTURE_ARCHITECTURE.md` |
| Auth / security / data protection | `17_SECURITY_ARCHITECTURE.md` |
| Deployment / Docker / CI | `18_DEPLOYMENT_ARCHITECTURE.md` |
| Code style / testing / Git | `19_ENGINEERING_STANDARDS.md` |
| Build order / priorities | `20_DEVELOPMENT_ROADMAP.md` |

## Rule 2: Do Not Drift

- Do NOT add database tables without updating `07_DATABASE_ARCHITECTURE.md`
- Do NOT add modules without updating `04_MODULE_ARCHITECTURE.md`
- Do NOT create UI without using components from `14_UI_UX_ARCHITECTURE.md`
- Do NOT add AI prompts without following `09_AI_ARCHITECTURE.md`
- Do NOT skip tenant_id in any database query
- Do NOT hardcode strings — use i18n (`15_I18N_ARCHITECTURE.md`)

If the architecture doesn't cover your case, **propose a change to the architecture doc** rather than improvising.

## Rule 3: Code Standards

Follow `19_ENGINEERING_STANDARDS.md` and `21_AI_COWORKER_RULES.md`:

- TypeScript strict mode, no `any`
- Zod for validation, infer types from schemas
- API pattern: auth → validate → authorize → service → respond
- Tailwind for styling, design tokens for colors
- Tests for business logic
- Conventional commits

## Rule 4: Multi-language

All user-facing features must support three languages:
- `zh` (Chinese) — primary, add first
- `en` (English)
- `ms` (Bahasa Melayu)

Use `useTranslations()` from next-intl. Never hardcode display text.

## Rule 5: Role Awareness

Every feature must respect the four-role hierarchy:
- `platform_admin` → system-wide access
- `operator` → tenant-wide access
- `leader` → own + downline access
- `member` → own data only

Check `05_USER_ROLES_AND_PERMISSIONS.md` for the permission matrix.

## Rule 6: Security

- Always filter by `tenant_id` in queries
- Use Prisma (never raw SQL with user input)
- Validate all inputs with Zod
- Check role permissions in middleware
- See `17_SECURITY_ARCHITECTURE.md`

## Rule 7: Update Docs With Code

When you change the system:
- New table → update `07_DATABASE_ARCHITECTURE.md`
- New endpoint → update `08_API_ARCHITECTURE.md`
- New module → update `04_MODULE_ARCHITECTURE.md`
- New component → verify it fits `14_UI_UX_ARCHITECTURE.md`

Architecture and code stay in sync. Always.

---

## Quick Start for a New Task

```
1. Read this file (AGENTS.md)
2. Read architecture/README.md
3. Identify which modules your task touches
4. Read the relevant architecture docs
5. Plan your implementation
6. Write the code
7. Update architecture docs if needed
8. Write tests
9. Commit with conventional commit message
```
