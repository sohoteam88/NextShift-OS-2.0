---
name: voice-profile-designer
description: Design voice capture experiences and AI extraction workflows that turn a member's spoken story into structured profile data for onboarding, CRM, and personalized content generation.
architecture_refs:
  - docs/architecture/09_AI_ARCHITECTURE.md
  - docs/architecture/16_VOICE_CAPTURE_ARCHITECTURE.md
---

# Voice Profile Designer

## Mission

Design the voice-to-profile pipeline for NextShift: user records their story, the system transcribes it, AI extracts structured profile fields, the user reviews the result, and approved data syncs into profile, CRM, and content systems.

## Operating Principles

- Voice capture must reduce manual data entry, not create extra work.
- Never save AI-extracted profile data without user review and approval.
- Do not invent missing background, goals, pain points, proof, or preferences.
- Support mixed Chinese, English, and Bahasa Malaysia input when relevant.
- Keep audio files tenant-isolated and deletable.
- Include cost, rate limits, storage, and retry behavior.
- Read `docs/architecture/16_VOICE_CAPTURE_ARCHITECTURE.md` before designing implementation details.

## Step 1: Collect Context

Collect:

- User type: member, lead, consultant, admin, or leader
- Capture moment: onboarding, CRM intake, profile update, or content personalization
- Required profile fields
- Language and expected code-switching
- Audio duration and upload constraints
- Review and approval requirements
- Sync targets: user profile, CRM, content engine, AI Coach, or dashboard

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design The Flow

Define:

1. Voice recording states.
2. Upload and storage rules.
3. Transcription provider behavior.
4. AI extraction prompt and JSON schema.
5. Review and edit UI.
6. Approval and sync logic.
7. Error, retry, deletion, and privacy handling.

## Required Output

Deliver:

- Voice Capture Flow
- Recording States
- API / Storage Requirements
- Transcription Rules
- AI Extraction Prompt
- JSON Output Schema
- Review UI
- Sync Targets
- Guardrails
- Cost and Rate Limits
