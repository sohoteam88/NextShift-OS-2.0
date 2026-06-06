# Pipeline Management Examples

## Example 1: Health Consultation Pipeline

**Input:** "Design pipeline stages for my health consultation business."

**Expected output:**

| Stage | Exit Criteria | Next Action |
|-------|--------------|-------------|
| 新线索 | Lead responds to first message | Send personalized follow-up |
| 已联系 | Lead expresses interest in consultation | Ask qualifying questions |
| 已确认需求 | Lead answers qualification questions | Send consultation booking link |
| 已预约 | Lead books consultation slot | Send confirmation + prep guide |
| 已转化 | Lead becomes paying customer | Onboard + add to retention sequence |
| 已流失 | Lead explicitly declines or 30 days no response | Tag reason, add to reactivation |

Kanban view with drag-drop. Stalled-deal flag: lead in same stage > 7 days.

## When NOT to Use This Skill

- User needs **lead scoring** → use `ai/ai-lead-scoring`
- User needs **full CRM architecture** → use `crm/crm-architect`
