# CRM Architect Examples

## Example 1: CRM Module Design for Health Consultant

**Input:** "Design the CRM architecture for a health consultant managing leads from Facebook funnels and WhatsApp referrals."

**Expected output:**

Modules: Lead Management, Pipeline, Customer Records, Follow-up, Tags, Activity Log, Analytics.

Lead lifecycle: New → Contacted → Qualified → Consultation Booked → Customer → Repeat → Referral Source.

Pipeline stages: 新线索 → 已联系 → 已确认需求 → 已预约 → 已转化 → 已流失.

Data model: leads (name, phone, whatsapp, source, score, stage, tags, owner_id, tenant_id), activities (lead_id, type, content, created_at), notes, tags, pipeline_stages.

Automations: auto-score on activity, stale-lead flag at 7 days, follow-up reminder at 48h.

## Example 2: Multi-Team CRM Permissions

**Input:** "Leader A has 5 team members. Each member should only see their own leads, but Leader A sees all."

**Expected output:** RBAC: member sees `leads WHERE user_id = me`, leader sees `leads WHERE user_id IN (my downline)`, operator sees `leads WHERE tenant_id = my tenant`. RLS policy + application-level filter. Sponsor tree query for downline resolution.

## When NOT to Use This Skill

- User needs **specific lead capture forms** → use `crm/lead-management`
- User needs **pipeline UI** → use `crm/crm-uiux`
- User needs **database schema** → use `data/crm-database`
