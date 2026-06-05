# 00 — System Overview

## Purpose

Provide a 360° view of NextShift OS — what it is, what it does, and how all parts connect.

## Scope

Covers the entire system at the highest level. For module-specific detail, see `04_MODULE_ARCHITECTURE.md` and individual module docs (10–16).

## What is NextShift OS?

NextShift OS is an **AI-guided personal brand, side-business, health consulting, and team duplication operating system**. It is a multi-tenant SaaS platform sold to **Operators** (MLM leaders / health business leaders in Malaysia) who onboard their **Members** (team distributors / consultants).

The platform replaces scattered tools (spreadsheets, WhatsApp groups, manual follow-ups) with a unified system that:

1. **Captures leads** — via funnels, landing pages, quizzes, and voice capture
2. **Manages relationships** — CRM with pipeline, scoring, timeline, tags
3. **Generates content** — AI-powered social media posts, funnel copy, WhatsApp replies
4. **Automates follow-up** — scheduled WhatsApp sequences, reminders, drip campaigns
5. **Guides members** — daily action plans, onboarding checklists, training progress
6. **Enables duplication** — sponsor trees, downline tracking, leader dashboards
7. **Provides insights** — analytics dashboards for admins, operators, and members

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Monolithic Next.js with modular boundaries | Fast to build, easy to deploy on VPS, can extract services later |
| Database | PostgreSQL via Supabase | Row-level security for multi-tenancy, real-time subscriptions, built-in auth |
| ORM | Prisma | Type-safe, migration-friendly, excellent DX |
| AI Provider | Switchable (OpenAI / Anthropic) | Avoid vendor lock-in, cost optimization |
| Messaging | WhatsApp Business API | Primary communication channel in Malaysian market |
| Deployment | VPS + Docker + Nginx | Cost-effective, full control, no cloud vendor lock-in |
| Languages | zh (primary), en, ms | Malaysian Chinese market first, expand to English and Malay |

## High-Level Data Flow

```
[User Browser / Mobile]
        │
        ▼
[Next.js Frontend (React + TailwindCSS)]
        │
        ▼
[Next.js API Routes / NestJS Backend]
        │
        ├──▶ [PostgreSQL / Supabase] ──▶ Row-Level Security
        ├──▶ [AI Provider (OpenAI / Anthropic)] ──▶ Content, Analysis, Coaching
        ├──▶ [WhatsApp Business API] ──▶ Automated messages
        ├──▶ [n8n Automation] ──▶ Webhooks, scheduled jobs
        ├──▶ [Supabase Storage] ──▶ Images, voice files, documents
        └──▶ [Speech-to-Text API] ──▶ Voice capture pipeline
```

## Main Components

See `04_MODULE_ARCHITECTURE.md` for full module map. Summary:

1. **Auth & Tenant Module** — login, signup, tenant isolation
2. **CRM Module** — leads, pipeline, scoring, timeline
3. **Funnel Module** — landing pages, quizzes, lead magnets
4. **AI Module** — content generation, lead analysis, coaching
5. **Automation Module** — WhatsApp sequences, reminders, webhooks
6. **Member Module** — onboarding, daily OS, training
7. **Team Module** — sponsor tree, duplication, performance
8. **Admin Module** — user management, templates, settings
9. **Analytics Module** — dashboards, events, reports
10. **Voice Capture Module** — speech-to-text, AI profile extraction
11. **I18N Module** — translation management, language switching

## Technical Considerations

- **Performance**: Server-side rendering for public funnel pages (SEO). Client-side for dashboard.
- **Offline**: Not required for MVP. Future consideration for mobile app.
- **Scale**: Design for 100 tenants × 500 members each = 50K users. PostgreSQL handles this comfortably.
- **Cost**: AI API calls are the primary variable cost. Implement caching and rate limiting per tenant.

## Future Expansion

- Mobile app (React Native, sharing Next.js API layer)
- Marketplace for funnel templates and AI prompt packs
- Integration with more messaging platforms (Telegram, LINE)
- White-label option for enterprise operators
- Payment integration (Stripe / local Malaysian payment gateways)

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| AI API cost spiral | Per-tenant quotas, caching, prompt optimization |
| WhatsApp API policy changes | Abstract messaging layer, support multiple channels |
| Single VPS failure | Docker Compose with automated backup, easy migration |
| Monolith becomes unwieldy | Strict module boundaries now, extract later if needed |
| Compliance (Malaysian Direct Sales Act, PDPA) | Built-in compliance checks, no income claims, data consent flows |
