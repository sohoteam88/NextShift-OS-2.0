# Brand DNA Audit

Date: 2026-06-12

## Where Brand Data Lives Now

| Location | What | Issue |
|----------|------|-------|
| `user.metadata.brand_profile` (JSON) | Confirmed brand profile (26 fields) | Single source of truth but unstructured |
| `BrandInterview.extractedProfile` (JSON) | AI-extracted profile | Transient — gets confirmed into user.metadata |
| `BrandInterview.answers` (JSON) | Raw interview data + dialogue state | Source material, not the DNA itself |
| `VoiceProfile.extractedData` (JSON) | Voice-extracted profile | Separate from brand profile |
| Various AI prompt strings | Hardcoded system prompts | Duplicated brand context |

## Existing Services

| Service | File | Role |
|---------|------|------|
| `brandInterviewService` | `brand-builder/services/` | Creates interviews, extracts profiles, confirms |
| `brandDnaGenerator` | `brand-discovery/brandDnaGenerator.ts` | Generates BrandDNA from extracted profile (Epic 3) |
| Bio service | `brand-builder/services/bio-service.ts` | Generates platform bios from brand_profile |
| Username service | `brand-builder/services/username-service.ts` | Generates usernames from brand_profile |
| Video strategy service | `video/services/video-strategy-service.ts` | Reads brand_profile for video strategy |
| AI coach recommend | `ai/coach/recommend/route.ts` | Rule-based coach recommendations |

## Duplicate Brand Logic

| Area | Duplication |
|------|-------------|
| Brand profile structure | Defined in 3 places: `brand-interview-service.ts` EXTRACTION_PROMPT, `brandDnaGenerator.ts`, `BrandProfileStep.tsx` |
| Content tone | Re-implemented per module (bio, username, video) |
| Target audience | Read from `user.metadata.brand_profile` inconsistently |
| AI prompts | Each module writes its own brand-context prompt string |

## Consolidation Plan

1. **Single schema** — `src/modules/brand-dna/types.ts` is the canonical BrandDNA type
2. **Single service** — `brandDnaService.ts` reads/writes `user.metadata.brand_profile`
3. **Context provider** — `BrandContextProvider.ts` exposes `getBrandContext()` for all AI modules
4. **Validation** — `brandDnaValidator.ts` checks completeness
5. **Versioning** — new `brand_dna_versions` table for snapshots

## What Can Be Reused

- `brand-interview-service.ts` — extraction pipeline
- `brandDnaGenerator.ts` — DNA generation from extracted data
- `BrandProfileStep.tsx` — existing editor patterns
- `user.metadata.brand_profile` — existing storage (no migration needed)
- All existing API routes that read/write brand_profile

## What Must Be Created

| File | Purpose |
|------|---------|
| `src/modules/brand-dna/types.ts` | Canonical BrandDNA type |
| `src/modules/brand-dna/services/brandDnaService.ts` | CRUD + validation |
| `src/modules/brand-dna/services/brandDnaValidator.ts` | Completeness check |
| `src/modules/brand-dna/services/BrandContextProvider.ts` | AI context for all modules |
| `src/modules/brand-dna/components/BrandDNAStudio.tsx` | Full studio UI |
| `src/modules/brand-dna/components/DNAHealthCard.tsx` | Dashboard health card |
| `src/modules/brand-dna/services/BrandDnaAdvisor.ts` | Rule-based recommendations |
