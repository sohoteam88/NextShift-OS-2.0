# Conversion Optimizer Examples

## Example 1: Landing Page Audit

**Input:** "Audit my health consultation landing page. Headline: '健康咨询'. CTA button at the bottom. No testimonials. Form asks for name, email, phone, age, weight, medical history."

**Expected output:**

Conversion Score: 35/100 (Grade: F)

| Check | Score | Diagnosis |
|-------|-------|-----------|
| headline_strength | 8/20 | "健康咨询" is generic — no audience, no outcome, no urgency. Rewrite: "忙碌妈妈专属：找到适合你的减重方案（免费 30 分钟咨询）" |
| cta_visibility | 10/20 | CTA only at bottom — not visible without scrolling. Add sticky CTA on mobile, repeat CTA after pain section and after social proof. |
| form_length | 5/20 | 6 fields including medical history — massive friction. Reduce to: name + WhatsApp only. Collect health info during consultation. |
| social_proof | 2/20 | Zero testimonials or credibility signals. Add: number of consultations done, before/after results, or "100+ 位妈妈已参加". |
| trust_elements | 10/20 | No credentials, no privacy mention, no "免费" emphasis. Add: your certification, "信息保密", free consultation badge. |

Priority fixes: 1) Rewrite headline (biggest impact), 2) Reduce form to 2 fields, 3) Add social proof, 4) Add sticky mobile CTA.

## When NOT to Use This Skill

- User needs to **build a funnel from scratch** → use `growth/funnel-builder`
- User needs **AI to generate landing page copy** → use `ai/ai-funnel-generator`
