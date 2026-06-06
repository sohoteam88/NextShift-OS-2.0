# UX Flow Architect Examples

## Example 1: Lead-to-Customer Flow

**Input:** "Design the user flow from when a member gets a new lead to when that lead becomes a customer."

**Expected output:**

```
New Lead Notification (push/in-app)
    → Tap → Lead Detail Screen
        → Primary CTA: "发送 WhatsApp"
            → AI suggests message → User edits → Send
            → Activity logged → Stage: "已联系"
        → Lead replies (webhook)
            → Notification → Tap → Chat view
            → AI suggests reply → Send
            → If interested → CTA: "预约咨询"
                → Calendar picker → Book
                → Stage: "已预约"
                → Reminder sequence activated
            → Consultation happens
                → Member marks: converted or lost
                → If converted → Stage: "已转化" 🎉
                → AI Coach: "恭喜！下一步：设定 30 天跟进提醒"
```

Decision points, dead ends, and recovery paths included. Every screen has one primary action.

## When NOT to Use This Skill

- User needs **first-run onboarding** → use `ux/onboarding-designer`
- User needs **pipeline stage design** → use `crm/pipeline-management`
