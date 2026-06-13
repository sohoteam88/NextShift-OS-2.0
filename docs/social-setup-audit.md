# Social Setup Audit

Date: 2026-06-12

## Existing Assets

| File | What It Does | Reusable? |
|------|-------------|-----------|
| `brand-builder/services/bio-service.ts` | Generates platform bios from brand_profile | Yes — pattern to follow |
| `brand-builder/services/username-service.ts` | Generates username suggestions | Yes — for IG username |
| `brand-builder/components/AccountSetupStep.tsx` | Account setup wizard step | Yes — UI patterns |
| `brand-builder/components/guides/FacebookGuide.tsx` | FB Page setup guide | Partially — instructional content |
| `brand-builder/components/guides/InstagramGuide.tsx` | IG setup guide | Partially — instructional content |
| `brand-builder/components/wizard/AccountsStepClient.tsx` | Wizard wrapper for account setup | Wire-up pattern |
| `brand-dna/services/BrandContextProvider.ts` | `getBrandContext()` — brand data for AI | **Must use** |
| `brand-builder/profile/route.ts` | Reads/writes brand_profile | Reads brand data |
| Bio generate/regenerate routes | API for bio generation | Reuse endpoints |

## Missing

| Need | Action |
|------|--------|
| Social profiles storage | Use `user.metadata.social_setup` JSON |
| FB/IG generation from BrandContext | Create `socialPromptGenerator.ts` |
| Social readiness scoring | Create `socialSetupValidator.ts` |
| Guided wizard UI | Create `SocialSetupWizard.tsx` |

## Implementation Plan

1. Store social setup in `user.metadata.social_setup` (no new table needed)
2. All generation reads from `getBrandContext()`
3. Wizard: Brand DNA → Generate FB → Generate IG → BIO → Visual → Save → Mission
