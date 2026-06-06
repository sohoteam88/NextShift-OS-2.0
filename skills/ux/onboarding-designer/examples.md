# Onboarding Designer Examples

## Example 1: 5-Minute First Success

**Input:** "Design onboarding so a new member gets their first content published within 5 minutes."

**Expected output:**

Flow: Welcome → AI Interview (3 questions) → AI generates brand DNA → AI generates first post → User reviews/edits → Publish → 🎉 Celebration

Step 1 — Welcome (30s):
"欢迎加入！接下来 5 分钟，你会拥有你的第一条专业内容。准备好了吗？"

Step 2 — AI Interview (90s):
Q1: "你帮助什么样的人？"（select: 想减重的妈妈 / 想变健康的上班族 / 想改善体质的年轻人 / 其他）
Q2: "你最擅长什么？"（select: 营养搭配 / 运动指导 / 生活方式 / 产品知识）
Q3: "你想在哪个平台发布？"（select: Facebook / Instagram / 两个都要）

Step 3 — Generate (30s): AI creates brand DNA + first post. Show loading animation: "正在为你创建内容..."

Step 4 — Review (60s): Show generated post with edit capability. "这是 AI 为你写的第一条帖子，你可以修改任何部分。"

Step 5 — Publish (30s): One-tap publish button. Celebration: "🎉 你的第一条内容已发布！"

Step 6 — Next mission: "下一步：添加你的第一个潜在客户 →"

## When NOT to Use This Skill

- User needs **general UX flow** (not first-run) → use `ux/ux-flow-architect`
- User needs **AI Coach behavior** → use `ai/ai-coach`
