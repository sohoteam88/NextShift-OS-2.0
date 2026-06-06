# Distributor Management Examples

## Example 1: New Distributor Onboarding Tracking

**Input:** "I have 8 new team members this month. Design how I track their onboarding progress."

**Expected output:**

Distributor profile fields: name, join_date, sponsor_id, onboarding_status (pending/in_progress/completed), training_step (1-5), first_post_date, first_lead_date, first_sale_date.

Onboarding checklist: 1) Complete profile, 2) Watch training video, 3) Set up funnel page, 4) Publish first content, 5) Generate first lead.

Leader dashboard card: "3/8 members completed onboarding. 2 stalled at step 3 (funnel setup)." AI Coach suggests: "发送操作指南给小李和小王？"

## When NOT to Use This Skill

- User needs **team tree visualization** → use `crm/team-duplication`
- User needs **CRM permissions** → use `crm/crm-architect`
