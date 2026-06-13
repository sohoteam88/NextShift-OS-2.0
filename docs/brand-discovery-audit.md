# Brand Discovery Audit

Date: 2026-06-12

## Executive Summary

The brand discovery system is **substantially implemented**. It has:
- A dialogue-based AI Coach conversation engine (WhatsApp-like chat)
- 6-slot extraction (current_occupation, previous_experience, hidden_expertise, preferred_audience, future_goal, personal_story)
- Text, voice, and dialogue interview modes
- AI-powered brand profile extraction (26 structured fields)
- Brand DNA confirmation/editing
- Wizard-based step progression
- Mission engine integration (notifies brand_discovery_completed and brand_dna_confirmed)

**What Epic 3 asks for that needs NEW work:** modularizing the slot engine, coach brain, and confidence engine into separate services; adding multi-dimensional confidence scoring; creating a chat+sidecar UI; generating Brand DNA explicitly.

---

## Reusable Components

| Component | Path | Reuse |
|-----------|------|-------|
| `InterviewStepClient` | `brand-builder/components/wizard/` | Chat UI pattern, slot sidebar, readiness meter |
| `VoiceRecorder` | `voice/components/VoiceRecorder.tsx` | Voice input (MediaRecorder) |
| `BrandProfileStep` | `brand-builder/components/BrandProfileStep.tsx` | Editable brand profile display |
| `TextInterview` | `brand-builder/components/TextInterview.tsx` | Q&A interview form |
| `ModeToggle` | `mission/components/ModeToggle.tsx` | Beginner/advanced mode |

## Reusable APIs

| Route | Reuse |
|-------|-------|
| `POST /api/v1/brand-builder/interview` | Create interview |
| `POST /api/v1/brand-builder/interview/[id]/message` | Send dialogue message |
| `POST /api/v1/brand-builder/interview/[id]/extract` | Extract brand profile |
| `POST /api/v1/brand-builder/interview/[id]/finish` | Finish + extract |
| `POST /api/v1/brand-builder/interview/[id]/confirm` | Confirm profile |
| `POST /api/v1/voice/upload` | Voice upload + transcription |

## Reusable Database Models

| Model | Status |
|-------|--------|
| `BrandInterview` | ✅ Complete — stores dialogue state, slots, extracted profile |
| `VoiceProfile` | ✅ Complete — stores audio URL, transcript, extracted data |
| `User.metadata.brand_profile` | ✅ Complete — confirmed brand profile (JSON) |
| `User.metadata.brand_builder_state` | ✅ Complete — wizard state |

## Missing Pieces (Epic 3 Deliverables)

| File | Status | Notes |
|------|--------|-------|
| `src/modules/brand-discovery/chat/` | **NEW** | Separate chat UI to replace inline InterviewStepClient chat |
| `slotExtractionService.ts` | **EXTRACT** | Modularize from brand-interview-service.ts slot logic |
| `coachBrain.ts` | **EXTRACT** | Modularize dialogue question selection from interview service |
| `brandConfidenceEngine.ts` | **NEW** | Multi-dimensional scoring (currently simple %) |
| `brandDnaGenerator.ts` | **NEW** | Explicit DNA generation from extracted profile |
| Confidence Card component | **NEW** | 6-dimension score display |
| Left+right panel layout | **NEW** | Chat (left) + confidence/slots (right) |

## Technical Debt

- Slot extraction logic is **embedded** in `brand-interview-service.ts` → extract to `slotExtractionService.ts`
- Coach question selection is **embedded** in dialogue engine → extract to `coachBrain.ts`
- Confidence is a **simple percentage** (filled slots / total) → upgrade to 6-dimension scoring
- Brand DNA generation is **part of extraction** → separate into `brandDnaGenerator.ts`
- AI prompts are **hardcoded strings** in service code → should be templated

## Architecture Decision

**Do NOT rebuild** the existing interview service, voice module, or API routes. They work.

**DO extract** the slot engine, coach brain, and confidence engine into separate modules for clarity and testability.

**DO create** a new `src/modules/brand-discovery/` module that:
1. Re-exports/wraps existing services
2. Adds the new chat UI with sidecar layout
3. Adds multi-dimensional confidence scoring
4. Adds explicit Brand DNA generation
5. Integrates with Mission Engine at confidence ≥ 70
