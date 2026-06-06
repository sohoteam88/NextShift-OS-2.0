# Dashboard UX Designer Examples

## Example 1: Member Home Dashboard

**Input:** "Design the dashboard a new member sees after login. They should know exactly what to do next."

**Expected output:**

Layout (mobile-first):
```
┌─────────────────────────┐
│ 早安，小美 ☀️            │
│                         │
│ ┌─────────────────────┐ │
│ │ AI Coach Mission    │ │
│ │ 今天的目标：发布 1 条内容│ │
│ │ 预计时间：15 分钟     │ │
│ │ [开始] ← primary CTA│ │
│ └─────────────────────┘ │
│                         │
│ ┌──────┐ ┌──────┐      │
│ │ 24   │ │ 12.5%│      │
│ │潜在客户│ │转化率 │      │
│ └──────┘ └──────┘      │
│                         │
│ 需要跟进 (3)             │
│ ├ 小王 — 评分 78 — 2天前  │
│ ├ 小李 — 评分 65 — 3天前  │
│ └ 小张 — 评分 52 — 5天前  │
│                         │
│ 最近活动                 │
│ └ ...                   │
└─────────────────────────┘
```

Hierarchy: AI Coach mission (primary) → KPI cards (context) → Follow-up list (urgent) → Activity (reference). Max 4 KPI cards. No chart on first screen (data too sparse for new users).

## When NOT to Use This Skill

- User needs **design tokens and components** → use `core/design-system-architect`
- User needs **analytics metrics definition** → use `data/analytics-engine`
