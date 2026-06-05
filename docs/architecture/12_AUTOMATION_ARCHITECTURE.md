# 12 — Automation Architecture

## Purpose

Define the automation layer — WhatsApp messaging, sequences, reminders, webhooks, and scheduled jobs.

## Scope

Automation module. For CRM triggers, see `10_CRM_ARCHITECTURE.md`. For AI replies, see `09_AI_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WhatsApp API | WhatsApp Business API (Cloud API via Meta) | Official, reliable, template messages |
| Automation engine | n8n (self-hosted) + internal scheduler | Visual workflows for complex, cron for simple |
| Message queue | Database-backed queue (ScheduledMessage table) | Simple, reliable, no Redis needed for MVP |
| Sequence model | JSON steps with delay and conditions | Flexible, operator-configurable |

## WhatsApp Integration

### Outbound Messages
- **Template messages**: Pre-approved by Meta, used for first contact and broadcasts
- **Session messages**: Free-form within 24h window after user reply
- Sent via Cloud API: `POST https://graph.facebook.com/v18.0/{phone_id}/messages`

### Inbound Messages
- Webhook registered with Meta → hits `/api/v1/automation/webhooks/whatsapp`
- n8n receives webhook → routes to NextShift API
- Creates Activity in CRM, triggers sequence logic

### WhatsApp Sequence

```json
{
  "name": "New Lead Welcome",
  "trigger": "new_lead",
  "steps": [
    {
      "delay_hours": 0,
      "type": "template",
      "template_name": "welcome_greeting",
      "variables": ["{lead_name}"]
    },
    {
      "delay_hours": 24,
      "type": "template",
      "template_name": "health_tip_day1",
      "condition": "lead.pipeline_stage == 'new'"
    },
    {
      "delay_hours": 72,
      "type": "ai_generated",
      "prompt_category": "whatsapp_reply",
      "condition": "lead.pipeline_stage != 'won'"
    }
  ]
}
```

## Scheduled Jobs

| Job | Frequency | Description |
|-----|-----------|-------------|
| Process message queue | Every 1 min | Send pending ScheduledMessages |
| Follow-up reminders | Every morning 8am | Notify members of today's follow-ups |
| Lead score recalc | Nightly 2am | Batch AI-assisted lead scoring |
| AI usage reset | Monthly 1st | Reset tenant AI quotas |
| Stale lead detection | Weekly | Flag leads with no activity > 30 days |
| Database backup | Daily 3am | pg_dump to external storage |

## Data Flow

```
[Trigger Event] → [Automation Service]
    │
    ├─ Immediate: Send message now
    │   → [WhatsApp API] → [Log Activity]
    │
    └─ Delayed: Create ScheduledMessage
        → [Scheduler picks up at scheduled_at]
        → [Check condition still valid]
        → [Send message] → [Log Activity]

[Inbound WhatsApp]
    → [n8n Webhook] → [API: create Activity]
    → [Check if sequence should advance]
    → [AI suggest reply (optional)]
    → [Notify member in-app]
```

## Main Components

```
src/modules/automation/
├── services/
│   ├── whatsapp.service.ts    ← Send messages via Cloud API
│   ├── sequence.service.ts    ← Manage sequences, enroll/advance leads
│   ├── scheduler.service.ts   ← Process message queue
│   └── reminder.service.ts    ← Follow-up reminder logic
├── workers/
│   ├── message-queue.ts       ← Cron: process ScheduledMessage table
│   ├── daily-reminders.ts     ← Cron: morning follow-up notifications
│   └── lead-scoring.ts        ← Cron: nightly batch scoring
└── api/
    ├── routes.ts
    └── webhooks.ts            ← Inbound webhook handlers
```

## Technical Considerations

- WhatsApp template messages must be approved by Meta before use (24–48h review)
- Rate limit: respect Meta's throughput limits (80 msgs/sec for standard tier)
- Retry logic: failed messages retry 3x with exponential backoff, then mark failed
- Idempotency: webhook handler must handle duplicate deliveries
- Timezone: follow-up reminders sent in tenant's configured timezone

## Future Expansion

- Telegram bot integration
- Email drip campaigns
- In-app push notifications
- Conditional branching in sequences (if replied → path A, if not → path B)
- Visual sequence builder UI

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| WhatsApp account ban for spam | Rate limiting, template-first, opt-in only |
| Message queue grows too large | Monitor queue depth, alert on backlog |
| n8n crash loses webhook data | n8n execution log + webhook retry from Meta |
| Timezone bugs | Store all times UTC, convert at display/notification time |
