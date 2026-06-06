# Health Funnel Builder Examples

## Example 1: Weight Management Quiz Funnel

**Input:** "Build a health quiz funnel for my weight management consulting in Malaysia. Target: 30-45 year old women."

**Expected output:**

Health Quiz: "你的体重管理类型是什么？" — 5 questions about eating habits, exercise, sleep, stress, goals. 3 result types with personalized recommendations.

Landing Page:
- Hero: "找到适合你的健康方案 — 3 分钟免费测试"
- Pain: 3 common struggles (tried diets that don't work, no time, rebound)
- Mechanism: "为什么你需要个性化方案而不是通用减肥法"
- CTA: "开始免费测试 →"

WhatsApp Follow-up (per result type):
- Day 0: "你的测试结果是 [类型]。这代表..."
- Day 2: Relevant health tip
- Day 4: Success story matching their type
- Day 6: "想要专属你的健康方案？预约免费 30 分钟咨询 →"

Consultation Flow: pre-consultation form (3 questions), WhatsApp confirmation, prep guide.

Compliance: no medical claims, no guaranteed weight loss numbers, no brand names unless user specifies.

## When NOT to Use This Skill

- User needs a **generic funnel** (not health-specific) → use `growth/funnel-builder`
- User needs **AI to generate the copy** → use `ai/ai-funnel-generator`
- User needs **Herbalife-specific** retail system → use `verticals/herbalife-retail-system`
