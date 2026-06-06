# AI Content Generator Examples

## Example 1: Social Post from Brand Profile

**Input:** "Generate a Facebook educational post about meal prep for busy moms. My niche is weight management for working mothers 30-45 in Malaysia."

**Expected output:**

Prompt template used: `Social Post Generator - Chinese`
Variables resolved: user_name=小美, specialty=体重管理, target_audience=30-45岁职业妈妈, topic=meal prep, platform=Facebook, tone=educational

Generated post (zh):
```
🍱 你以为没时间准备健康餐？

我以前也这样想。每天下班累得只想叫外卖。

直到我发现了「周末 2 小时备餐法」：
1️⃣ 周六买菜 + 切好所有食材
2️⃣ 周日用 2 小时煮 5 天的午餐
3️⃣ 分装冷冻，每天早上拿一盒出门

省时间 ✅ 省钱 ✅ 吃得健康 ✅

想要我的 7 天备餐食谱？留言「食谱」我私信给你 👇
```

AI usage logged: 847 input tokens, 312 output tokens, ~$0.018.

## Example 2: Repurpose to Multi-Platform

**Input:** "Take the meal prep post and create versions for Instagram Reel script and Xiaohongshu note."

**Expected output:**

Instagram Reel (15s script):
```
Hook: "职业妈妈没时间做饭？试试这个方法"
Scene 1: 展示冰箱里 5 个整齐的便当盒
Scene 2: 快速剪辑备餐过程
CTA: "保存这个视频！完整食谱在 bio link 👆"
```

Xiaohongshu note:
```
标题：职业妈妈周末 2 小时备餐法 | 省时省钱又健康

正文：（搜索友好、实用笔记风格、关键词丰富）...
```

## Example 3: Content with Lead Context

**Input:** "Generate a WhatsApp reply for a lead who asked '你们的产品真的有效吗？'"

**Expected output:** AI reads lead context (score: 65, stage: contacted, note: interested in weight management), generates empathetic reply that addresses trust concern with social proof, avoids income/guarantee claims.

## When NOT to Use This Skill

- User needs **content strategy and 90-day calendar** → use `growth/content-engine`
- User needs **funnel copy** (landing page, lead magnet) → use `ai/ai-funnel-generator`
- User needs **video scripts** → use `verticals/ai-video-engine`
