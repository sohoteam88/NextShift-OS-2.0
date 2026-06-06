# Herbalife Retail System Examples

## Example 1: New Customer 30-Day Journey

**Input:** "Design the journey for a new Herbalife customer from first purchase to reorder."

**Expected output:**

Customer journey:
```
First Purchase → Day 0: Welcome + Usage Guide
    → Day 1: "开始使用了吗？有任何问题随时问我"
    → Day 3: Usage tip (how to prepare shake correctly)
    → Day 7: "第一周感觉怎么样？" + progress reflection
    → Day 14: Nutrition education (why consistent usage matters)
    → Day 21: "你离 30 天目标越来越近了！" + success story
    → Day 25: Reorder reminder "你的产品快用完了"
    → Day 30: Progress review + reorder CTA
    → Day 30+: If reordered → repeat cycle. If not → Day 35 check-in, Day 45 reactivation.
```

WhatsApp scripts for each touchpoint (in Chinese). CRM fields: purchase_date, product, usage_start_date, last_checkin, reorder_date, next_reorder_due.

Compliance: no income claims, no medical guarantees, education-focused, Herbalife Nutrition disclosure.

## When NOT to Use This Skill

- User needs a **generic health funnel** → use `verticals/health-funnel-builder`
- User needs **team management** → use `crm/distributor-management`
