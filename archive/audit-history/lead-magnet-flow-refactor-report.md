# Lead Magnet Flow Refactor Report

Date: 2026-06-19
Source spec: `LEAD_MAGNET_FLOW_REFACTOR.md`

## Problem

The Lead Magnet Builder behaved like an assessment tool:

```text
Topic
↓
Assessment
↓
Score
↓
Category
```

This created extra input friction and positioned the feature as a diagnostic quiz instead of a creation tool.

## Target Flow

Implemented target:

```text
Interview Authority
↓
Brand DNA
↓
Lead Magnet Type Selection
↓
Lead Magnet Generation
↓
Landing Page Generation
↓
Publish
```

## Changes

| Area | Before | After |
| --- | --- | --- |
| User input | Type + audience pain text | Type only |
| Types | Assessment / quiz / checklist | Guide / checklist / template |
| Authority data | User had to re-enter pain | Pulls from BrandContext backed by Interview Authority / Brand DNA |
| Output | Questions, score categories, result page | Lead magnet content, landing page copy, publish action |
| Publish | No direct publish path | New publish API creates and publishes a real funnel landing page |

## Files Changed

| File | Change |
| --- | --- |
| `src/modules/lead-magnet/types.ts` | Added creation types, authority context, resource sections, landing page metadata |
| `src/modules/lead-magnet/leadMagnetGenerators.ts` | Rebuilt deterministic generator around guide/checklist/template assets |
| `src/modules/lead-magnet/leadMagnetService.ts` | Generates from BrandContext only; adds landing page funnel creation/publish |
| `src/app/api/v1/lead-magnet/generate/route.ts` | Removed `audiencePain`; accepts only creation types |
| `src/app/api/v1/lead-magnet/publish/route.ts` | New endpoint for publishing the generated landing page |
| `src/modules/lead-magnet/components/LeadMagnetDashboard.tsx` | New creation-first UI and publish flow |
| `src/modules/lead-magnet/leadMagnetAdvisor.ts` | Updated guidance to describe authority-driven creation |
| `src/modules/lead-magnet/leadMagnetValidator.ts` | Updated validation for generated resources instead of quiz questions |

## Authority Rule

The UI no longer asks for information already available in authority sources.

Used fields:

- Audience from Brand DNA / BrandProfile.
- Audience pain from Brand DNA.
- Offer from Brand DNA.
- Promise from Brand DNA positioning or transformation promise.
- Messaging from Brand DNA core message, unique angle, and elevator pitch.

## Success Criteria

| Criteria | Status |
| --- | --- |
| User can generate Lead Magnet within 2 minutes | PASS |
| User can generate Landing Page within 2 minutes | PASS |
| User does not re-enter Interview / Brand DNA data | PASS |
| User can publish generated landing page | PASS |
| Assessment / score / category no longer drives primary flow | PASS |

## Residual Notes

Legacy assessment and quiz types remain in TypeScript only so existing saved metadata can be read without crashing. The new API and UI do not expose them as options.
