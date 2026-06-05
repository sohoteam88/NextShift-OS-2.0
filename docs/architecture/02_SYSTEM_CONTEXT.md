# 02 — System Context

## Purpose

Map all external systems NextShift OS communicates with and define the integration boundaries.

## Scope

External dependencies, third-party APIs, infrastructure services. Internal module communication is covered in `04_MODULE_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI provider abstraction | Adapter pattern with provider interface | Switch between OpenAI/Anthropic without code changes |
| WhatsApp integration | WhatsApp Business API (official) | Reliability, compliance, template messages |
| Speech-to-text | OpenAI Whisper API (or self-hosted Whisper) | Best multilingual support for zh/en/ms |
| File storage | Supabase Storage | Integrated with auth, RLS, signed URLs |
| Email | Resend or Postmark (transactional only) | Low volume, high deliverability |
| Automation | n8n (self-hosted on same VPS) | Open source, visual workflows, webhook-native |

## System Context Diagram

```
┌─────────────────────────────────────────────────────┐
│                   NextShift OS                       │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Frontend  │  │ Backend  │  │ Background Jobs  │  │
│  │ (Next.js) │  │ (API)    │  │ (n8n / cron)     │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────────┐
│ Supabase │  │ AI Providers │  │ WhatsApp API │
│ - Postgres│  │ - OpenAI     │  │ (Business)   │
│ - Auth   │  │ - Anthropic  │  └──────────────┘
│ - Storage│  └──────────────┘
│ - Realtime│         │         ┌──────────────┐
└──────────┘         ▼         │ Speech-to-   │
                ┌──────────┐   │ Text (Whisper)│
                │ n8n      │   └──────────────┘
                │ (self-   │
                │ hosted)  │   ┌──────────────┐
                └──────────┘   │ Email (Resend)│
                               └──────────────┘
```

## Data Flow

### Inbound
- **WhatsApp webhooks** → n8n → API → CRM (new lead / reply received)
- **Funnel form submissions** → API → CRM (new lead)
- **Voice uploads** → Supabase Storage → Whisper API → AI extraction → CRM profile

### Outbound
- **WhatsApp messages** → API → WhatsApp Business API (follow-up, sequences)
- **AI requests** → API → OpenAI/Anthropic (content, analysis, coaching)
- **Email notifications** → API → Resend (operator alerts, system notifications)

## Main Components (External)

| System | Role | Auth Method | Rate Limits |
|--------|------|-------------|-------------|
| Supabase | Database, Auth, Storage, Realtime | Service role key + RLS | Depends on plan |
| OpenAI API | GPT-4o for content, analysis | API key | TPM/RPM based on tier |
| Anthropic API | Claude for content, analysis (fallback/alt) | API key | RPM based on tier |
| WhatsApp Business API | Send/receive messages | Access token | 1000 msgs/day (starter) |
| Whisper API | Speech-to-text | OpenAI API key | Standard OpenAI limits |
| n8n | Workflow automation | Internal (same VPS) | No external limit |
| Resend | Transactional email | API key | 100/day free, then paid |

## Technical Considerations

- All API keys stored in environment variables, never in code
- External API calls must have timeout (10s default), retry (3x with exponential backoff), and circuit breaker
- AI provider calls must be wrapped in the AI adapter (see `09_AI_ARCHITECTURE.md`)
- WhatsApp template messages must be pre-approved by Meta
- All external data must be validated/sanitized before storage

## Future Expansion

- Telegram Bot API integration
- LINE Messaging API (for broader SEA market)
- Stripe / local payment gateway for subscription billing
- Google Calendar API for scheduling follow-ups
- Zapier / Make integration for operator-level automation

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| WhatsApp API account suspension | Follow Meta policies strictly, rate limit messages, template-first approach |
| AI API downtime | Dual provider with automatic failover |
| Supabase outage | Daily PostgreSQL backup to separate storage, migration path to self-hosted Postgres |
| n8n crash | Docker restart policy, health checks, workflow state persistence |
| API key compromise | Key rotation plan, minimal permissions, audit logging |
