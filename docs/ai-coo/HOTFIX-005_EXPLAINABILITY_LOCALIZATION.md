# HOTFIX-005 Explainability Localization

Status: P0 Hotfix

Owner: AI COO System

Depends on:

- COO-004 Explainability Engine PRD
- COO-004 Explainability Engine Audit

## Problem

The Explainability Engine accepted a `locale` input, but the locale was ignored. Dashboard headers could render in Chinese while the explanation body remained English, creating mixed-language recommendations.

## Objective

The Explainability Engine must generate explanation copy in the user's resolved language. Dashboard, projection adapters, and React components must not translate or rewrite explanation text.

## Supported Locales

- `zh`
- `en`
- `ms`

Unsupported locales fall back to English.

## Locale Resolution

Locale is resolved in this order:

1. Explicit locale override
2. User language preference
3. Workspace default language
4. Browser locale when supplied
5. English fallback

## Output Contract

Each localized explanation includes:

- `whyThis`
- `whyNow`
- `whyNotOthers`
- `expectedOutcome`
- `expectedRisk`
- `nextMilestone`

Mission explanation metadata also records the resolved `locale`.

## Dashboard Rule

Dashboard only displays `ExplainabilityResult` returned by Mission Authority. It must not translate in:

- Dashboard components
- Dashboard projection adapters
- React rendering logic

## Audit Rule

Mission decision audit metadata stores the resolved `locale` next to all six explanation fields.

## Acceptance Criteria

- Explainability Engine uses locale.
- English templates exist.
- Chinese templates exist.
- Malay templates exist.
- Dashboard receives localized explanation.
- No translation logic exists in Dashboard.
- Type-check passes.
- Build passes.
