# Lead Magnet Builder Audit

Date: 2026-06-12

## Existing Assets

- No existing lead magnet module. This is entirely new.
- Will store in `user.metadata.lead_magnet` JSON.
- All generation powered by `getBrandContext()`.
- Segmentation connects to CRM later (Epic 9+).
- Output feeds Funnel Builder (Epic 9).

## Implementation

- Types: LeadMagnetConfig, AssessmentConfig, QuizConfig, ChecklistConfig, ResultPage, CTABlock, LeadSegment
- Generators: deterministic from BrandContext + audience pain
- V1 types: Assessment, Quiz, Checklist
- Segmentation: A/B/C/D lead classification
