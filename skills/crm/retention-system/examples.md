# Retention System Examples

## Example 1: Wellness Product Reorder System

**Input:** "Design a retention system for my health product customers. Average reorder cycle is 30 days."

**Expected output:**

Retention stages: Active (purchased < 30 days) → Due (30-45 days) → At Risk (45-60 days) → Dormant (60+ days).

Automated touchpoints:
- Day 7: Usage check-in ("你用得怎么样？有什么问题吗？")
- Day 21: Results check ("感觉到变化了吗？")
- Day 28: Reorder reminder ("你的产品快用完了，需要补货吗？")
- Day 45: Concern check ("好久没联系了，一切还好吗？")
- Day 60: Reactivation offer (bundle deal)

Churn risk signals: no reply to 2+ messages, negative feedback, price complaint. Dashboard: retention rate, reorder rate, churn risk count.

## When NOT to Use This Skill

- User needs **marketing-side retention** (campaigns, offers) → use `growth/retention-marketer`
- User needs **customer journey mapping** → use `crm/customer-journey`
