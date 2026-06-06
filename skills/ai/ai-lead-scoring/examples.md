# AI Lead Scoring Examples

## Example 1: Define Scoring Model for Health Consultant CRM

**Input:** "Design a lead scoring model for my health consultation business. Leads come from Facebook funnels and WhatsApp referrals."

**Expected output:**

Scoring signals and weights (total 100):
| Signal | Points | Condition |
|--------|--------|-----------|
| Has phone number | +10 | phone field not null |
| Has WhatsApp | +10 | whatsapp field not null |
| Responded to message | +15 | activity type = reply within 48h |
| Clicked funnel CTA | +10 | funnel_click event tracked |
| Completed health quiz | +15 | quiz_completed = true |
| Referral source | +10 | source = referral |
| Asked about pricing | +10 | note contains price keywords |
| Booked consultation | +20 | appointment_booked = true |
| No response 7+ days | -15 | last_activity > 7 days ago |
| Opted out | -100 | opted_out = true |

Thresholds: Hot ≥ 70, Warm 40-69, Cold < 40

Next-best-action by segment:
- Hot → call/WhatsApp immediately, priority CTA in dashboard
- Warm → send educational content, schedule follow-up in 2 days
- Cold → add to nurture sequence, review in 2 weeks

## Example 2: Explain a Score

**Input:** "Lead 小李 has score 55. Why?"

**Expected output:**
```
小李 — 评分: 55/100 (Warm 🟡)

得分明细:
✅ 有电话号码 (+10)
✅ 有 WhatsApp (+10)
✅ 完成健康问卷 (+15)
✅ 来源: Facebook 漏斗 (+5)
✅ 回复了第一条消息 (+15)
❌ 未预约咨询 (0/20)
❌ 未询问价格 (0/10)

建议下一步: 发送一个成功案例故事，然后邀请预约免费咨询
```

## When NOT to Use This Skill

- User needs **manual lead qualification criteria** → use `crm/lead-management`
- User needs **pipeline stage definitions** → use `crm/pipeline-management`
- User needs **AI to auto-send follow-up** → use `ai/whatsapp-automation`
