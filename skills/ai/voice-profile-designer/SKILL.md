---
name: voice-profile-designer
description: "Design voice-to-profile workflows for NextShift OS: browser audio recording, speech-to-text (Whisper), AI profile extraction (pain points, goals, story angle, content pillars), review UX, and profile sync. Use when a user needs voice capture flow, transcription pipeline, AI extraction prompts, voice profile UX, profile questionnaire, member story capture, or voice-to-content workflow."
architecture_refs:
  - docs/architecture/16_VOICE_CAPTURE_ARCHITECTURE.md
  - docs/architecture/09_AI_ARCHITECTURE.md
  - docs/architecture/07_DATABASE_ARCHITECTURE.md
---

# Voice Profile Designer

## Mission

Design the complete voice-to-profile pipeline: a member speaks their story, the system transcribes it, AI extracts a structured profile, and the user reviews and approves — replacing tedious form-filling with a natural, authentic capture experience.

## Operating Principles

- Voice capture should feel easier than filling out a form, not harder.
- The user must always review and edit AI-extracted data before it's saved — never auto-commit.
- Handle zh/en/ms and code-switching (mixed Chinese + English is common in Malaysia).
- Keep recordings short (≤ 5 minutes) to control cost and processing time.
- Audio is sensitive data — respect privacy, allow deletion, tenant-isolate storage.
- Make outputs implementation-ready for Claude Code or Codex.
- Write in the user's language unless they request another language.

## Scope

This skill covers:

- Voice recording UX (browser MediaRecorder API)
- Audio upload and processing pipeline
- Speech-to-text integration (Whisper API)
- AI extraction prompt design
- Structured profile data model
- Review and edit UX
- Profile sync to CRM/member data
- Multi-language handling
- Cost control

## Step 1: Collect Context

Collect:

- What aspect of voice capture needs design (full pipeline, UX only, AI prompt only, etc.)
- Target user (new member onboarding, lead profiling, or content creation)
- Languages expected (zh, en, ms, or mixed)
- What profile fields need extraction
- How extracted data will be used (CRM, content generation, coaching)
- Integration points (where does extracted data go?)

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design the Pipeline

### Recording UX

Design the recorder component states:

```
idle → recording → uploading → processing → review → approved
```

Include:

- Visual waveform indicator during recording
- Timer (max 5:00)
- Pause/resume support
- Cancel with confirmation
- Auto-stop at limit
- File size check before upload (≤ 10 MB)

### Transcription Pipeline

```
Browser (WebM/Opus) → Server (convert to MP3 via ffmpeg)
    → Supabase Storage (voice/{tenant_id}/{user_id}/{timestamp}.mp3)
    → Whisper API (model: whisper-1)
    → Raw transcript saved to voice_profiles.transcript
```

Language handling:

- If user selects language → pass to Whisper `language` param
- If mixed (zh + en code-switching) → omit `language`, let Whisper auto-detect

### AI Extraction

Design the extraction prompt to output structured JSON:

```json
{
  "summary": "2-3 sentence bio",
  "pain_points": ["..."],
  "health_goals": ["..."],
  "story_angle": "the emotional hook of their journey",
  "content_pillars": ["pillar1", "pillar2", "pillar3"],
  "background": "professional/personal background",
  "motivation": "why they started this journey",
  "preferred_topics": ["..."],
  "tone": "inspirational | educational | personal | professional"
}
```

Prompt must include:

- "The transcript may contain mixed Chinese and English."
- "Extract in {user_language}."
- "If information is not mentioned, set the field to null — do not invent data."
- "Respond in JSON only."

### Review UX

After extraction, show a form pre-filled with AI-extracted fields:

- Summary (textarea, editable)
- Pain points (tag input, add/remove)
- Health goals (tag input)
- Story angle (text input)
- Content pillars (tag input, max 5)
- Background (textarea)
- Motivation (textarea)
- Tone (select dropdown)

User clicks **Approve** → data syncs to:

- `users.bio`, `users.metadata` (member profile)
- `leads.notes` (if also a lead — auto-append)
- AI prompt context for future content generation

### Profile Sync

Define what happens after approval:

- Which database fields are updated
- How AI uses the profile in future content generation
- Whether the audio file is retained or can be deleted

## Step 3: Output

Deliver one or more of:

- Voice recorder component spec (states, props, UI)
- Transcription pipeline spec (upload → convert → transcribe)
- AI extraction prompt (complete, tested)
- Extraction JSON schema
- Review UX wireframe/spec
- Profile sync logic
- Database model (if extending VoiceProfile)
- Cost estimate per recording
- API endpoint specs

End with the first implementation step.

## Cost Reference

| Operation | Estimate | Control |
|-----------|----------|---------|
| Whisper transcription | ~$0.006/min | Max 5 min = $0.03 per recording |
| AI extraction (Claude Sonnet) | ~$0.02 per call | Single call per recording |
| Storage (MP3 128kbps) | 5 min ≈ 5 MB | Supabase Storage pricing |
| Rate limit | Max 3 recordings per user per day | Prevent abuse |

## Integration with Other Skills

- After voice profile is approved → `ai/ai-content-generator` uses profile fields as context variables
- Voice profile story → `growth/personal-brand` uses it for positioning
- Pain points + goals → `crm/lead-management` enriches lead record
- Content pillars → `growth/content-engine` uses them for content planning
