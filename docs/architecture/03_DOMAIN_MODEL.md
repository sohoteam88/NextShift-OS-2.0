# 03 — Domain Model

## Purpose

Define the core business entities, their relationships, and the ubiquitous language used across the system.

## Scope

Domain concepts only. For database tables, see `07_DATABASE_ARCHITECTURE.md`. For API resources, see `08_API_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tenant model | Operator = Tenant owner | Each operator gets an isolated workspace |
| User hierarchy | Platform Admin → Operator → Leader → Member | Maps to real-world MLM structure |
| Lead lifecycle | Lead → Prospect → Customer / Member | Simple, matches existing mental model |
| Content ownership | Content belongs to Member, templates belong to Operator | Members generate from templates, own their output |

## Ubiquitous Language

| Term | Definition | Example |
|------|-----------|---------|
| **Tenant** | An isolated workspace owned by an Operator | "Sarah's Health Team" |
| **Operator** | The person who purchased NextShift OS for their team | Sarah (team leader with 200 members) |
| **Member** | A team member within an Operator's tenant | Ahmad (new consultant in Sarah's team) |
| **Leader** | A Member with elevated permissions (manages sub-team) | Jason (manages 20 members under Sarah) |
| **Lead** | A potential customer/recruit captured by the system | Someone who filled a quiz funnel |
| **Prospect** | A Lead that has been contacted and is in active pipeline | Lead who replied to WhatsApp |
| **Customer** | A converted Lead who purchased a product | Someone who bought a health package |
| **Recruit** | A converted Lead who joined as a new Member | Someone who signed up as distributor |
| **Funnel** | A landing page + lead capture flow | Quiz → results → WhatsApp CTA |
| **Pipeline** | Stages a Lead moves through toward conversion | New → Contacted → Interested → Closing → Won/Lost |
| **Daily OS** | The member's daily action checklist | Post content, follow up 3 leads, complete training |
| **Sponsor** | The Member who recruited another Member | Jason is Ahmad's sponsor |
| **Downline** | All Members below a given Member in the sponsor tree | Ahmad's downline includes everyone he recruited |

## Entity Relationship Diagram

```
Platform Admin
    │
    ▼
Tenant ──────────────────────────────────────────┐
    │                                            │
    ▼                                            ▼
Operator (1 per Tenant)                    Subscription
    │                                            │
    ├──▶ Member (many)                           ▼
    │       │                              Plan / Billing
    │       ├──▶ Lead (many, owned by Member)
    │       │       │
    │       │       ├──▶ Activity Log (many)
    │       │       ├──▶ Tags (many-to-many)
    │       │       ├──▶ Notes (many)
    │       │       └──▶ Pipeline Stage
    │       │
    │       ├──▶ Content (many, generated)
    │       ├──▶ Funnel (many, created from templates)
    │       ├──▶ Daily Action (many)
    │       ├──▶ Training Progress
    │       └──▶ Voice Profile
    │
    ├──▶ Funnel Template (many)
    ├──▶ AI Prompt Template (many)
    ├──▶ CRM Settings (pipeline stages, tags, etc.)
    └──▶ Team Tree (sponsor relationships)
```

## Core Entities

### Tenant
- `id`, `name`, `slug`, `plan`, `settings`, `created_at`
- Owns: Operator, Members, Leads, Funnels, Templates, Settings

### User (polymorphic across roles)
- `id`, `tenant_id`, `email`, `name`, `role`, `language_preference`, `status`
- Roles: `platform_admin`, `operator`, `leader`, `member`

### Lead
- `id`, `tenant_id`, `owner_id` (Member), `name`, `phone`, `email`, `source`, `pipeline_stage`, `score`, `tags[]`, `created_at`
- Belongs to a Member, within a Tenant

### Funnel
- `id`, `tenant_id`, `owner_id`, `template_id`, `title`, `slug`, `config`, `status`, `published_at`

### Content
- `id`, `tenant_id`, `owner_id`, `type` (post/story/reply), `platform`, `body`, `language`, `generated_by_ai`, `created_at`

### Activity
- `id`, `tenant_id`, `lead_id`, `user_id`, `type`, `description`, `metadata`, `created_at`
- Polymorphic: call, message, note, status_change, funnel_visit

### SponsorRelationship
- `id`, `tenant_id`, `sponsor_id`, `member_id`, `level`, `created_at`

## Data Flow

```
Voice Input → Whisper → AI Extract → Lead Profile (CRM)
Funnel Visit → Form Submit → Lead Created → Pipeline "New"
Member Action → AI Generate Content → Post to Social
Lead Reply → WhatsApp Webhook → Activity Log → AI Suggest Reply
```

## Technical Considerations

- All entities are tenant-scoped (every query must include `tenant_id`)
- Soft delete for leads, members, content (never hard delete user data)
- Activity log is append-only (immutable audit trail)
- Tags are tenant-scoped (each operator defines their own tag set)

## Future Expansion

- Product entity (for tracking sales, not just leads)
- Event entity (for webinars, meetups, training sessions)
- Achievement / Badge entity (gamification)
- Referral tracking entity (track which funnel generated which lead)

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Domain model too rigid for different industries | Use configurable pipeline stages, custom tags, flexible metadata |
| Sponsor tree depth causes performance issues | Materialized path or nested set model, pre-computed levels |
| Lead ownership disputes between members | Clear ownership rules: first contact owns, transfer requires admin |
