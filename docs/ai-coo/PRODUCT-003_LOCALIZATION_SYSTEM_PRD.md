# PRODUCT-003 Localization System PRD

Version: V8

Status: P0 Productization

Owner: Product Experience Team

## Depends On

- PRODUCT-001 First User Experience
- PRODUCT-002 Personalization Engine
- COO-004 Explainability Engine
- EXEC-001 Mission Execution Workspace
- EXEC-006 Multi-Mission Orchestration

## Mission

Transform NextShift OS from a translated product into a native-language product.

Current behavior:

- English system
- Translation layer
- User receives translated text

Target behavior:

- Localized system
- Native-language experience
- User feels the product was built in their language

## Core Philosophy

Localization is not translation. Localization is adaptation.

Bad: English UI with translated text.

Good: user feels the product was built in their language.

## Supported Languages

Version 1:

- English (`en`)
- Chinese (`zh`)
- Malay (`ms`)

## Localization Hierarchy

1. System Language
2. Business Language
3. Generated Assets
4. Agent Outputs
5. Outcome Language
6. User Experience

## Scope

Must localize:

- Dashboard
- Mission Workspace
- Outcome View
- Agent Outputs
- Mission Plans
- Explainability
- Approval Queue
- Verification Messages
- Notifications
- Errors
- Success States

## New Component

`LocalizationEngine`

Purpose: provide a single source of truth for user-facing language.

```ts
interface LocalizedText {
  key: string;
  locale: string;
  value: string;
}
```

## Locale Resolution

Priority:

1. User Preference
2. Tenant Setting
3. Browser Locale
4. System Default

Default: English.

## Dashboard Localization

Examples:

| Key | English | Chinese | Malay |
| --- | --- | --- | --- |
| Current Goal | Current Goal | 当前目标 | Matlamat Semasa |
| Mission | Mission | 任务 | Misi |
| Verification Status | Verification Status | 验证状态 | Status Pengesahan |

## Mission Workspace Localization

Localize:

- Objective
- Description
- Steps
- Buttons
- Status
- Progress
- Assets
- Verification

Rule: no English UI labels when locale is `zh` or `ms`.

## Outcome Localization

Example:

- English: `Acquire First Lead`
- Chinese: `获得第一位潜在客户`
- Malay: `Dapatkan Prospek Pertama`

Rule: outcome templates must be localized.

## Explainability Localization

Explainability localization already exists.

Extend it so all explanation templates are localized.

Rule: no mixed-language output.

## Agent Output Localization

Current problem:

- Prompt says write in Chinese.
- Body, title, or CTA may still be English.

Target:

- Chinese locale produces Chinese body, titles, and CTA.
- Malay locale produces Malay body, titles, and CTA.

Rule: asset content must be generated in the target language, not merely instructed to use the target language.

## Asset Localization

Localize:

- Lead Magnets
- Landing Pages
- Offers
- CRM Scripts
- Traffic Plans
- Content Drafts

## Notification Localization

Examples:

- Mission Completed
- Asset Approved
- Verification Passed
- Approval Required

All must be localized.

## Error Localization

Examples:

- Invalid Login
- Mission Failed
- Verification Error
- Approval Expired

All must be localized.

## Localization Registry

Purpose: store all user-facing strings.

Rules:

- No hardcoded UI text.
- All user-facing labels must come from the Localization Registry.
- Missing translations may fall back to English.
- Raw key names must never be shown to users.

## Localization Coverage

Track:

- Localized keys
- Missing keys
- Fallback usage

Target: 100% coverage.

## Fallback Rules

Missing translation flow:

1. Fallback to English.
2. Log missing key.
3. Never show raw key names.

## Generated Content Rules

Content language must match resolved locale.

Examples:

- Locale `zh` produces Chinese lead magnet content.
- Locale `ms` produces Malay lead magnet content.

## Personalization Integration

Flow:

1. Personalization Engine
2. Localization Engine
3. Generated Asset

Rule: personalization occurs before localization.

## Audit Logging

Store:

- `locale`
- `translationSource`
- `fallbackUsed`

Purpose: localization quality audits.

## Metrics

- Localization Coverage target: 100%
- Mixed-Language Output target: 0%
- Fallback Usage target: less than 1%
- User Language Match target: 100%

## Acceptance Criteria

- Localization Engine exists.
- Dashboard localization keys exist.
- Workspace localization keys exist.
- Outcome localization keys exist.
- Agent outputs are localized.
- Generated assets are localized.
- Notifications are localized.
- Errors are localized.
- Registry exists.
- Locale resolution follows user, tenant, browser, system default priority.
- Missing keys never render raw key names.
- Localization audit metadata is stored with generated assets.
- Type-check passes.
- Build passes.

## Final Principle

Users should never feel like they are using a translated product.

They should feel like they are using a product built for them.

Language is part of the product experience. Localization is a product feature, not a translation task.
