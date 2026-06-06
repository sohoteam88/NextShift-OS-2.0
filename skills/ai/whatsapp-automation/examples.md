# WhatsApp Automation Examples

## Example 1: Post-Funnel Lead Follow-up

**Input:** "Design WhatsApp automation for leads who submitted the health quiz but didn't book a consultation."

**Expected output:**

5-message sequence:
1. Immediate: "谢谢你完成健康测试！你的结果是 [result_type]。这代表..."
2. Day 1: Educational tip related to their result type
3. Day 3: Success story matching their profile
4. Day 5: "很多像你一样的 [audience] 通过免费咨询找到了适合自己的方案。想聊聊吗？"
5. Day 7: Final gentle nudge + respect opt-out

Triggers: quiz_completed = true AND appointment_booked = false
Handoff rule: if lead replies with question → route to human (operator/member)
Guardrails: max 1 message/day, respect "不需要了" as opt-out, no auto-reply after 9pm

## Example 2: Appointment Reminder

**Input:** "Send reminders before a consultation appointment."

**Expected output:** 3 messages: 24h before (confirm + what to prepare), 2h before (reminder + WhatsApp link), 15min after no-show (reschedule offer).

## When NOT to Use This Skill

- User needs **human WhatsApp sales scripts** → use `growth/whatsapp-closer`
- User needs **email sequences** → use `ai/email-automation`
