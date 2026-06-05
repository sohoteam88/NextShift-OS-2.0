# 16 — Voice Capture Architecture

> Voice-to-profile pipeline: user speaks their story → system extracts structured profile data.

---

## 1. Purpose

Allow new members (or leads) to record a voice memo describing their background, health journey, pain points, and goals. The system transcribes the audio, then uses AI to extract a structured profile that populates CRM fields, member profiles, and content pillars — eliminating manual data entry and producing richer, more authentic member profiles.

## 2. Scope

- Audio recording (browser)
- Speech-to-text transcription
- AI-powered profile extraction
- Structured data storage
- Review & edit flow
- Multi-language support (zh, en, ms)

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recording | Browser MediaRecorder API | No native app needed; works on mobile Chrome/Safari |
| Audio format | WebM (Opus) → convert to MP3 for storage | Opus is browser-native; MP3 for broad compatibility |
| Transcription | OpenAI Whisper API | Best multi-language accuracy; handles zh/en/ms code-switching |
| AI extraction | Anthropic Claude (primary) / OpenAI (fallback) | Structured JSON output, strong Chinese comprehension |
| Storage | Supabase Storage (audio files) | Consistent with platform storage layer |
| Max duration | 5 minutes | Enough for a meaningful story; keeps transcription cost reasonable |

---

## 4. Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser     │────▶│  Upload API  │────▶│  Supabase   │
│  Recording   │     │  /api/v1/    │     │  Storage    │
│  (WebM)      │     │  voice/upload│     │  /voice/    │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Whisper API │
                    │  transcribe  │
                    └──────┬───────┘
                           │ transcript text
                    ┌──────▼───────┐
                    │  AI Extract  │
                    │  (Claude)    │
                    │  → JSON      │
                    └──────┬───────┘
                           │ structured profile
                    ┌──────▼───────┐
                    │  Save to DB  │
                    │  voice_profiles│
                    │  + update    │
                    │  user/lead   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Review UI   │
                    │  (user edits)│
                    └─────────────┘
```

---

## 5. Main Components

### 5.1 Voice Recorder Component

```
src/components/organisms/VoiceRecorder.tsx
```

States: `idle` → `recording` → `uploading` → `processing` → `review`

Features:
- Visual waveform indicator during recording
- Timer display (counts up to 5:00 max)
- Pause / resume support
- Cancel with confirmation
- Auto-stop at 5 minutes

### 5.2 Upload API

```
POST /api/v1/voice/upload
Content-Type: multipart/form-data
Body: { audio: File, language?: 'zh'|'en'|'ms' }
Response: { voiceProfileId: string, status: 'processing' }
```

Server-side steps:
1. Validate file size (≤ 10 MB) and MIME type
2. Convert WebM → MP3 via ffmpeg (server-side)
3. Upload MP3 to Supabase Storage: `voice/{tenant_id}/{user_id}/{timestamp}.mp3`
4. Create `voice_profiles` record with status `transcribing`
5. Queue transcription job (or process inline for MVP)

### 5.3 Transcription

```
POST https://api.openai.com/v1/audio/transcriptions
model: whisper-1
language: (auto-detect or user-specified)
response_format: verbose_json (includes segments with timestamps)
```

Save raw transcript to `voice_profiles.transcript`.

### 5.4 AI Profile Extraction

Prompt template (see `09_AI_ARCHITECTURE.md`):

```
System: You are a profile analyst for a health and wellness platform.
Extract the following fields from the user's spoken story.
Respond in JSON only.

User: Transcript: """{transcript}"""

Expected JSON:
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

Save extracted JSON to `voice_profiles.extracted_data`.

### 5.5 Database Schema

```prisma
model VoiceProfile {
  id             String   @id @default(cuid())
  tenant_id      String
  user_id        String
  audio_url      String
  duration_secs  Int
  language       String   @default("zh")
  transcript     String?  @db.Text
  extracted_data Json?
  status         String   @default("recording")
  // status: recording | transcribing | extracting | review | approved | failed
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  tenant Tenant @relation(fields: [tenant_id], references: [id])
  user   User   @relation(fields: [user_id], references: [id])

  @@index([tenant_id])
  @@index([user_id])
}
```

### 5.6 Review & Edit UI

After extraction, user sees a form pre-filled with AI-extracted fields:

- Summary (textarea, editable)
- Pain points (tag input, add/remove)
- Health goals (tag input)
- Story angle (text input)
- Content pillars (tag input, max 5)
- Background (textarea)
- Motivation (textarea)

User clicks **Approve** → status becomes `approved` → extracted fields are synced to:
- `users.bio`, `users.metadata` (member profile)
- If the user is also a lead: `leads.notes` (auto-append)
- AI prompt context for future content generation

---

## 6. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/voice/upload` | Upload audio, start processing |
| GET | `/api/v1/voice/:id` | Get voice profile status + data |
| GET | `/api/v1/voice/me` | Get current user's voice profiles |
| PATCH | `/api/v1/voice/:id` | Update extracted fields after review |
| POST | `/api/v1/voice/:id/approve` | Mark as approved, sync to profile |
| POST | `/api/v1/voice/:id/retry` | Re-run transcription or extraction |
| DELETE | `/api/v1/voice/:id` | Delete voice profile + audio file |

---

## 7. Cost Control

| Operation | Cost estimate | Control |
|-----------|---------------|---------|
| Whisper transcription | ~$0.006/min | Max 5 min = $0.03 per recording |
| AI extraction | ~$0.01-0.03 per call | Single call per recording |
| Storage | ~$0.023/GB/month | MP3 at 128kbps: 5 min ≈ 5 MB |

Tenant quota: included in AI usage quota (see `09_AI_ARCHITECTURE.md`).

---

## 8. Multi-language Handling

- User selects language before recording (or auto-detect)
- Whisper `language` param improves accuracy for single-language audio
- Code-switching (zh + en mixed): omit language param, let Whisper auto-detect
- AI extraction prompt includes: `The transcript may contain mixed Chinese and English. Extract in {user_language}.`

---

## 9. Technical Considerations

- **ffmpeg dependency:** Required server-side for WebM → MP3 conversion. Install in Docker image.
- **File size:** Client-side check before upload; reject > 10 MB
- **Processing time:** Whisper + AI extraction ≈ 15-30 seconds for 5-min audio. Show progress bar with status polling (GET `/api/v1/voice/:id` every 3 seconds)
- **Privacy:** Audio files are tenant-isolated in storage paths. Only the user and their operator can access. Audio can be deleted after extraction if the user requests.

---

## 10. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| Poor transcription in noisy environments | Show transcript for user review; allow manual correction |
| AI extracts wrong information | Review step is mandatory before approval |
| Browser MediaRecorder inconsistency | Test on Chrome/Safari/Firefox; provide fallback file upload |
| Cost spike from abuse | Rate limit: max 3 recordings per user per day |
| Large audio files slow upload | Client-side compression; show upload progress |

---

## 11. Future Expansion

- Real-time transcription streaming (Whisper streaming API when available)
- Voice tone analysis (energy, confidence) for coaching insights
- Re-record individual sections rather than entire story
- Team leader can request voice capture from a new member via invitation link
- Auto-generate first social media post from voice profile

---

**Cross-references:** `07_DATABASE_ARCHITECTURE.md` (VoiceProfile model), `09_AI_ARCHITECTURE.md` (extraction prompt), `08_API_ARCHITECTURE.md` (voice endpoints)
