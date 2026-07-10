# Journey Flow Fix Report

**Date:** 2026-06-14
**Scope:** Fix new user onboarding flow — Brand Interview must precede Brand DNA
**Status:** ✅ Complete

---

## Problem

New user journey was: `/dashboard → /journey → /brand-dna` — skipping the brand interview entirely. The brand interview collects founder story, product info, and audience data that Brand DNA depends on.

## Fix

### 1. Journey Steps Updated

**File:** `src/app/(auth)/journey/page.tsx`

| Funnel | Before | After |
|---|---|---|
| Retail | Steps: `[Brand DNA, Social Setup]` | Steps: `[Brand Interview, Brand DNA, Social Setup]` |
| Recruitment | Steps: `[Brand DNA, Brand Discovery]` | Steps: `[Brand Interview, Brand DNA, Brand Discovery]` |

The "Brand Interview" step routes to `/brand-builder/step/interview`.

### 2. Brand DNA Guard Added

**File:** `src/app/(auth)/brand-dna/page.tsx`

Server-side check: if user has no `BrandInterview` record, show CTA page instead of BrandDNAStudio:

```
"先完成品牌访谈" → links to /brand-builder/step/interview
```

After completing the interview, the Brand DNA page renders normally.

### 3. New User Flow

```
Before (wrong):               After (fixed):
/dashboard                     /dashboard
  → /journey                     → /journey
    → /brand-dna ✗                 → /brand-builder/step/interview ✓
                                      → /brand-dna ✓
                                        → next journey step
```

### 4. Dashboard CTA Unchanged

The dashboard "打开旅程" button still points to `/journey`. No changes needed — the journey page now correctly lists the interview as the first step.

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```

---

## Files Changed (2)

| File | Change |
|---|---|
| `src/app/(auth)/journey/page.tsx` | Added Brand Interview as first step in retail + recruitment journeys |
| `src/app/(auth)/brand-dna/page.tsx` | Added server-side guard — redirect to interview if no data |

## Risk

| Risk | Status |
|---|---|
| Existing users with Brand DNA but no interview | ✅ Guard only affects users with zero interviews |
| UI redesign | ✅ None — CTA page uses existing design tokens |
| DB schema | ✅ None — uses existing `BrandInterview` table |
