# 10 — CRM Architecture

## Purpose

Define the CRM system — lead management, pipeline, scoring, follow-up, and customer journey.

## Scope

CRM module. For database schema, see `07_DATABASE_ARCHITECTURE.md`. For AI features, see `09_AI_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipeline model | Configurable stages per tenant | Each operator has different sales process |
| Lead scoring | Hybrid: rule-based + AI-assisted | Rules for consistency, AI for pattern recognition |
| Lead ownership | Member owns leads they create/receive | Clear accountability |
| Follow-up system | Next-followup date + reminder notification | Simple, effective |

## Main Components

### 1. Lead Management
- Create leads: manual entry, funnel submission, WhatsApp inbound, voice capture
- Lead profile: name, phone, email, source, tags, notes, metadata
- Bulk import via CSV (operator-level feature)
- Duplicate detection: match on phone number within tenant

### 2. Pipeline
- Configurable stages per tenant (default: New → Contacted → Interested → Closing → Won → Lost)
- Drag-and-drop Kanban board view
- List view with filters and sorting
- Stage change triggers activity log entry
- Stage change can trigger automation (WhatsApp sequence)

### 3. Lead Scoring

#### Rule-Based Scoring (0–100)
| Signal | Points |
|--------|--------|
| Has phone number | +10 |
| Has email | +5 |
| Came from funnel (not manual) | +10 |
| Completed quiz | +15 |
| Replied to WhatsApp | +20 |
| Multiple interactions | +5 per interaction (max +25) |
| Days since last contact > 14 | -10 |
| Days since last contact > 30 | -20 |

#### AI-Assisted Scoring
- Nightly batch job analyzes lead data and activity patterns
- Adjusts score based on conversion likelihood
- Suggests "Hot Leads" to prioritize

### 4. Follow-up System
- `next_followup` date on each lead
- Dashboard widget: "Today's Follow-ups"
- Notification: in-app + optional WhatsApp reminder to member
- Overdue follow-ups highlighted in red

### 5. Customer Journey Timeline
- Chronological list of all activities for a lead
- Types: funnel visit, form submission, WhatsApp message, call, note, stage change, AI interaction
- Filterable by type
- Shows full context for each interaction

### 6. Tags
- Tenant-scoped tag library (operator creates tags)
- Multi-tag per lead
- Color-coded
- Filterable in lead list and pipeline views

### 7. Notes
- Free-text notes attached to leads
- Timestamped, attributed to user
- Supports markdown (basic)

### 8. Activity Log
- Automatic logging of all lead interactions
- Manual activity entry (call log, meeting note)
- Used for scoring, timeline, and analytics

## Data Flow

```
[Lead Source] → [Create Lead API] → [Lead record in DB]
    │
    ├──▶ [Auto-score based on rules]
    ├──▶ [Auto-assign pipeline stage: "New"]
    ├──▶ [Trigger automation if configured]
    └──▶ [Log activity: "lead_created"]

[Member interacts with lead]
    → [Log activity]
    → [Recalculate score]
    → [Update last_contacted]
    → [If stage change: trigger automation]
```

## Technical Considerations

- Pipeline view uses optimistic UI updates (update UI immediately, sync to DB)
- Lead list supports server-side pagination, filtering, and search
- Phone numbers stored in E.164 format, displayed localized
- Lead export to CSV (for operator backup/reporting)

## Future Expansion

- Email integration (track email opens/clicks)
- Call recording integration
- Lead source attribution analytics
- Multi-pipeline per tenant (separate for products vs recruitment)
- Custom fields per tenant

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| CRM too complex for new members | Progressive disclosure: simple view first, advanced features unlockable |
| Lead data quality issues | Validation on phone/email, duplicate detection |
| Scoring model inaccuracy | Allow operator to adjust scoring weights |
