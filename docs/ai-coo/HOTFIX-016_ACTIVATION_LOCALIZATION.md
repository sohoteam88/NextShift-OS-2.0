# HOTFIX-016 Activation Localization

Version: V8

Status: Implemented

Owner: Product Growth Team

Depends on:

- PRODUCT-003 Localization System
- PRODUCT-004 Activation Engine
- HOTFIX-015 Activation Drop-Off Engine

## Problem

Activation messages were generated directly by Activation Engine and could mix English, Chinese, and Malay in the same first-user experience. This made activation feel translated instead of native.

## Objective

All activation-related copy must originate from the Localization Engine and respect the user's language preference before falling back to English.

## Scope

Localized activation coverage includes:

- Activation state labels
- Current step labels
- Activation funnel milestone labels
- Success signals
- First value labels
- Current mission descriptions and CTA labels
- At-risk reminders
- Drop-off and recovery interventions
- AI COO activation risk title and reason
- Dashboard activation card labels

## Locale Resolution

Activation uses the same locale order as Localization Engine:

1. User preference
2. Tenant locale
3. Browser locale
4. English fallback

The live `getActivationProjection` path passes `user.languagePreference` into `buildActivationProjection`.

## Implementation

- `LocalizationEngine` owns `activation.*` registry keys for `en`, `zh`, and `ms`.
- `activation-localization.ts` resolves locale and formats activation messages with interpolation.
- `ActivationProjection` carries `localization` metadata:
  - `locale`
  - `localeSource`
  - `translationSource`
  - `fallbackUsed`
  - `messageKeys`
  - localized state, step, first value, recovery, and AI COO risk copy.
- `ActivationIntervention` carries message localization metadata:
  - `messageKey`
  - `locale`
  - `translationSource`
  - `fallbackUsed`
- `FirstUserExperienceService` consumes localized activation labels and first-value copy.
- `AICommandCard` uses `next-intl` keys for the dashboard activation card and displays localized state labels instead of raw enum values.
- AI COO activation risk detector uses `activationProjection.localization.aiCooRiskTitle` and `aiCooRiskReason`.

## Fallback Rules

- Unsupported or missing locale falls back to English.
- Missing translation keys never render raw key names.
- `fallbackUsed` is true when either locale resolution or key lookup uses fallback.
- Audit metadata stores localization details for activation state changes, at-risk reminders, drop-offs, completed steps, and activation completion.

## Acceptance Criteria

- Activation messages localized: done.
- Activation states localized: done.
- Interventions localized: done.
- Recovery messages localized: done.
- Dashboard activation card localized: done.
- AI COO activation messaging localized: done.
- Fallback works without raw keys: done.
- Type-check passes: done.
- Build passes: done.

## Verification

- `pnpm type-check`
- `pnpm vitest run src/__tests__/services/activation-engine.test.ts src/__tests__/services/first-user-experience.test.ts src/__tests__/services/localization-engine.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts`
- `pnpm build`

## Principle

Activation is part of onboarding. Onboarding is part of product value. Localization is therefore part of activation.
