# Voice Profile Designer Examples

## Example 1: New Member Onboarding Voice Capture

**Input:** "Design the voice capture experience for new member onboarding. After a member joins, they should record their story so AI can extract their profile."

**Expected output:** Component spec for VoiceRecorder with 6 states (idle → recording → uploading → processing → review → approved), API endpoint `POST /api/v1/voice/upload`, Whisper integration spec, AI extraction prompt with 9-field JSON output, review form layout, approval → sync logic to `users.metadata`.

## Example 2: AI Extraction Prompt Only

**Input:** "Write the AI prompt for extracting profile data from a voice transcript. The member speaks in Chinese."

**Expected output:** Complete system prompt + user prompt template with `{transcript}` variable, explicit instruction for JSON-only output, 9-field schema, "do not invent data" guardrail, language handling for mixed zh/en input.

## Example 3: Voice Profile to Content Pipeline

**Input:** "How does the voice profile feed into content generation?"

**Expected output:** Data flow diagram: Voice Profile `content_pillars` + `tone` + `story_angle` → AI Content Generator `{specialty}`, `{content_pillars}`, `{tone}` variables → social post generation with personalized context.

## When NOT to Use This Skill

- User needs **general AI prompt design** → use `ai/ai-content-generator` or `ai/ai-coach`
- User needs **CRM lead profiling without voice** → use `crm/lead-management`
- User needs **personal brand positioning** → use `growth/personal-brand`
