# AI Assistant Designer Examples

## Example 1: First-Time Dashboard AI Coach

**Input:** "Design what the AI Coach shows when a brand-new member opens the dashboard for the first time."

**Expected output:**

```
欢迎来到 NextShift，小美！

我是你的 AI 教练。接下来 5 分钟，
我会帮你完成 3 件事：

1️⃣ 确认你的品牌定位（2 分钟）
2️⃣ 生成你的第一条内容（2 分钟）  
3️⃣ 发布到 Facebook（1 分钟）

完成后你就有了：
✅ 清晰的个人品牌
✅ 第一条专业内容
✅ 上线的社交媒体

开始？
```

Flow after tap "开始": AI asks 3 positioning questions → generates brand DNA → shows preview → user confirms → AI generates first post → user edits → publishes.

States: welcome → interview → generating → preview → edit → publish → celebrate → next mission.

## Example 2: AI Coach for Returning User with Stalled Pipeline

**Input:** "A member has 12 leads in pipeline but hasn't followed up in 5 days."

**Expected output:** AI Coach proactively shows: "你有 3 位热门客户等待跟进，最热的是小王（评分 78）。要我帮你写一条 WhatsApp 跟进消息吗？" → tap → AI generates message → user reviews → sends.

## When NOT to Use This Skill

- User needs the **AI Coach prompt template** (system prompt, variables) → use `ai/ai-coach`
- User needs **dashboard layout design** → use `ux/dashboard-ux-designer`
