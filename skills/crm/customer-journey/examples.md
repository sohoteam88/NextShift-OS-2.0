# Customer Journey Examples

## Example 1: Health Product Customer Lifecycle

**Input:** "Map the customer journey from lead to repeat buyer for my wellness product business."

**Expected output:**

Journey map:
```
Visitor → Lead (quiz/content) → Contacted (WhatsApp) → Consultation → First Purchase → Onboarding (usage guide) → 7-Day Check-in → 30-Day Review → Reorder Reminder → Repeat Customer → Referral Source
```

Touchpoints per stage with channel (WhatsApp/email/in-app), message type, owner, and automation flag. Drop-off risks: post-purchase silence (Days 2-6), no reorder at Day 25. Recovery: check-in message, usage tips.

## When NOT to Use This Skill

- User needs **pipeline stages** → use `crm/pipeline-management`
- User needs **retention automation** → use `crm/retention-system`
