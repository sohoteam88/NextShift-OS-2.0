# Lead Management Examples

## Example 1: Lead Capture from Health Quiz Funnel

**Input:** "A lead completes my health quiz. What data do I capture and what happens next?"

**Expected output:**

Capture fields: name, phone, WhatsApp (checkbox), quiz result type, source=health_quiz, utm params.

Auto-actions on creation:
1. Status = "new", Score = 25 (has phone + completed quiz)
2. Tag: quiz result type (e.g., "需要营养调整")
3. Activity: "Completed health quiz — result: 需要营养调整"
4. Trigger: WhatsApp welcome message (Day 0 sequence)
5. Assign to: member who owns the funnel

Lead card shows: name, phone, score badge (25 — Cold), stage (新线索), tags, next action ("Send WhatsApp welcome").

## Example 2: Stale Lead Recovery

**Input:** "I have 30 leads with no activity in 14+ days. How do I handle them?"

**Expected output:** Filter: `last_activity_at < 14 days ago AND status != lost`. Bulk action: tag "dormant", assign reactivation sequence. AI suggests personalized reactivation message per lead based on their quiz result and last interaction.

## When NOT to Use This Skill

- User needs **pipeline stage design** → use `crm/pipeline-management`
- User needs **AI-powered scoring** → use `ai/ai-lead-scoring`
