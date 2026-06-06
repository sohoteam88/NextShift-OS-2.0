# WhatsApp Closer Examples

## Example 1: Health Consultation Follow-up

**Input:** "A lead downloaded my meal prep guide. Write a WhatsApp follow-up sequence to book a free consultation."

**Expected output:** 5-message sequence over 7 days: Day 0 (delivery + question), Day 1 (value tip), Day 3 (story/proof), Day 5 (soft pitch), Day 7 (last chance + CTA). Each message in Chinese with WhatsApp-friendly formatting.

## Example 2: Objection Handling

**Input:** "My lead said '太贵了，我负担不起'. How do I respond?"

**Expected output:** Objection classification (price), acknowledgment response, reframe around cost of inaction vs investment, clarifying question ("Is it the total amount or the timing?"), lower-commitment next step option.

## When NOT to Use This Skill

- User needs **automated WhatsApp flows** (bot) → use `ai/whatsapp-automation`
- User needs a **full funnel** → use `growth/funnel-builder`
