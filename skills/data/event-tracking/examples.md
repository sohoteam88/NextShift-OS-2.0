# Event Tracking Examples

## Example 1: CRM Event Tracking Plan

**Input:** "Define tracking events for the CRM module."

**Expected output:**

| Event Name | Trigger | Properties | Type |
|-----------|---------|------------|------|
| lead.created | New lead added | source, funnel_id, has_phone, has_whatsapp | Conversion |
| lead.stage_changed | Pipeline drag | from_stage, to_stage, lead_id | Activity |
| lead.contacted | First message sent | channel (whatsapp/call/email), lead_id | Activity |
| lead.score_updated | Score recalculated | old_score, new_score, lead_id | System |
| lead.converted | Becomes customer | time_to_convert_days, lead_id | Conversion |
| lead.lost | Marked as lost | reason, stage_at_loss, lead_id | Conversion |
| note.added | Note created | lead_id, word_count | Activity |

Naming convention: `{entity}.{past_tense_action}`. All events include: tenant_id, user_id, timestamp (auto).

## When NOT to Use This Skill

- User needs **metric formulas** → use `data/analytics-engine`
- User needs **database schema** → use `data/crm-database`
