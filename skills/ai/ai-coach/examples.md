# AI Coach Examples

## Example 1: Daily Mission Card for New Member

**Input:** "Design the AI Coach experience for a new member who just completed onboarding. They haven't published any content yet."

**Expected output:**

AI Coach Card:
```
小美，

今天的目标：
发布你的第一条健康教育帖子

预计时间：15 分钟

AI 会帮你：
1. 根据你的定位生成 3 个帖子选项
2. 你选一个，编辑，发布

开始？
```

State machine: idle → suggested → started (AI generates 3 posts) → user picks one → review/edit → publish → completed → next mission suggested.

Nudge rules: if user doesn't start within 2 hours, send gentle reminder. If user starts but doesn't finish, show "继续？" after 30 min idle.

## Example 2: Leader Coach — Team Follow-up Reminder

**Input:** "Design AI Coach for a leader who has 3 team members with overdue follow-ups."

**Expected output:**

AI Coach Card:
```
Steven,

你的团队有 3 位成员需要跟进

预计时间：10 分钟

优先级：
1. 小李 — 加入 7 天未发布内容
2. 小王 — 3 天未登录
3. 小张 — 本周日报未完成

查看团队？
```

Actions: tap member → see their activity → AI suggests message template → leader sends via WhatsApp.

## Example 3: Post-Conversion Celebration + Next Mission

**Input:** "A member just converted their first lead into a customer. What does AI Coach say?"

**Expected output:**
```
恭喜！🎉 你成功转化了第一位客户！

你的进度：
✅ 建立品牌定位
✅ 发布第一条内容
✅ 获得第一个潜在客户
✅ 转化第一位客户 ← 刚刚完成！

下一个里程碑：
在 7 天内获得第一个客户转介绍

准备好了吗？
```

## When NOT to Use This Skill

- User needs the **AI Coach UX component design** (layout, cards, animations) → use `core/ai-assistant-designer`
- User needs **AI agent orchestration** (multi-agent routing, tool use) → use `ai/ai-agent-orchestrator`
- User needs to **generate content** → use `ai/ai-content-generator`
