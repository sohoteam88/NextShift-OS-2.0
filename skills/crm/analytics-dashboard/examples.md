# Analytics Dashboard Examples

## Example 1: Member Dashboard Metrics

**Input:** "Design the analytics dashboard a member sees to track their performance."

**Expected output:**

Top row (KPI cards):
- 我的潜在客户: 24 (+3 this week)
- 转化率: 12.5%
- AI 使用量: 45/100 次
- 本月内容: 8 篇

Charts:
- Pipeline funnel (leads by stage, horizontal bar)
- Weekly activity (leads added, content published, follow-ups sent — line chart)

Action section: "3 位客户需要跟进" with CTA → lead list filtered by overdue follow-up.

## Example 2: Operator Dashboard

**Input:** "Design what the operator (tenant admin) sees."

**Expected output:** Tenant-wide metrics: total users, active users (7-day), total leads, conversion rate, AI usage vs quota, storage usage vs limit. Team leaderboard: top 5 members by leads converted. Alerts: 2 members inactive 7+ days, AI quota at 85%.

## When NOT to Use This Skill

- User needs **metric definitions and formulas** → use `data/analytics-engine`
- User needs **event tracking plan** → use `data/event-tracking`
