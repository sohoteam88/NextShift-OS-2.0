# PRODUCT-002 Personalization Engine PRD

Version: V8

Status: P0 Strategic

Owner: Product Experience Team

## Depends On

- PRODUCT-001 First User Experience
- COO-001 Business State Engine
- COO-005 Mission Generator V2
- EXEC-002A Real Agent Outputs
- EXEC-006 Multi-Mission Orchestration

## Mission

Make every generated asset feel uniquely created for the user.

The system should stop producing generic outputs and produce contextual outputs that reflect the user's business, audience, offer, language, and mission context.

## Core Philosophy

Users do not want generic AI-generated content. They want content that feels like it was created specifically for them.

Current behavior:

- User A requests a lead magnet.
- User B requests a lead magnet.
- Both users receive effectively the same output.

Target behavior:

- User A receives a unique lead magnet.
- User B receives a different lead magnet.
- The difference is driven by Brand DNA, business context, audience, offer, mission history, outcome history, and generated asset history.

## Personalization Hierarchy

1. Brand DNA
2. Business Context
3. Audience
4. Offer
5. Mission Context
6. Asset Generation

## New Component

`PersonalizationEngine`

Purpose: create a unified personalization profile that agents can consume when generating assets.

```ts
interface PersonalizationProfile {
  brandDNA: BrandDNA;
  businessContext: BusinessContext;
  audience: AudienceProfile;
  offer: OfferProfile;
  missionHistory: MissionHistory;
  outcomeHistory: OutcomeHistory;
  assetHistory: AssetHistory;
  internalScore: PersonalizationScore;
}
```

## Personalization Sources

- AI Interview
- Brand DNA
- Business State
- Mission History
- Outcome History
- Generated Asset History

## Personalization Dimensions

- Identity
- Audience
- Offer
- Tone
- Goals
- Stage
- Experience
- Region
- Language

## Identity Layer

Examples:

- Personal Brand
- Coach
- Entrepreneur
- Consultant
- Network Marketer
- Business Owner

Rule: identity influences all generated assets.

## Audience Layer

Examples:

- Mothers
- Entrepreneurs
- Weight loss market
- Working professionals
- Students

Rule: audience determines pain, language, examples, and CTA.

## Offer Layer

Examples:

- Lead generation
- Health program
- Weight management
- Business opportunity
- Coaching program

Rule: offer changes lead magnet, landing page, content, and follow-up.

## Stage Layer

Source: Business State Engine

Examples:

- `BRAND_FOUNDATION` creates educational assets.
- `LEAD_GENERATION` creates conversion assets.
- `CUSTOMERS` creates retention assets.

## Outcome Layer

Source: Outcome Orchestrator

Examples:

- `FIRST_LEAD` creates lead capture assets.
- `FIRST_CUSTOMER` creates sales assets.
- `RETENTION_SYSTEM` creates customer success assets.

## Asset Personalization Rules

Content outputs must be audience-specific, offer-specific, brand-specific, and language-specific.

Lead magnet outputs must change by market:

- Weight loss market: `7 Hidden Habits Preventing Fat Loss`
- Business opportunity: `7 Mistakes New Entrepreneurs Make Before Their First Lead`

Funnel outputs must be audience-specific and offer-specific.

CRM outputs must use lead source and mission context to generate context-aware follow-up.

## Mission History Integration

Purpose: avoid repetitive outputs.

Rules:

- Previous lead magnet topics should not be repeated.
- Previous content should drive a new angle.
- Future assets reference history before generation.

## Asset Memory

Store:

- Asset topics
- Asset themes
- Asset titles
- Asset performance

## Language Personalization

Supported languages:

- English
- Chinese
- Malay

Rule: all generated assets respect locale.

## Personalization Score

Internal only.

Measures:

- Relevance
- Uniqueness
- Context match

Rule: never show personalization score to users.

## Agent Integration

Agents consume the `PersonalizationProfile` before producing asset content:

- Content Agent -> Personalization Engine -> Content Output
- Lead Magnet Agent -> Personalization Engine -> Lead Magnet Output
- Funnel Agent -> Personalization Engine -> Funnel Output
- CRM Agent -> Personalization Engine -> CRM Output

## Verification Rules

Personalization Engine may influence outputs.

Personalization Engine may not influence:

- Business State
- Verification
- Mission Completion
- Guardrails
- Priority
- Bottleneck

## Metrics

- Personalized Asset Rate target: 100%
- Duplicate Asset Rate target: less than 5%
- Asset Approval Rate target: 80%
- Mission Completion Lift target: +25%

## Acceptance Criteria

- Personalization Profile exists.
- Brand DNA is integrated.
- Audience is integrated.
- Offer is integrated.
- Business State stage is integrated.
- Mission history is integrated.
- Outcome history is integrated.
- Asset history is integrated.
- Agents consume personalization profile.
- Assets become context-aware.
- Personalization score remains internal only.
- Personalization does not affect mission completion, verification, guardrails, priority, or bottleneck authority.
- Type-check passes.
- Build passes.

## Final Principle

Users do not judge AI by intelligence. Users judge AI by relevance.

The most valuable output is not the smartest output. The most valuable output is the output that feels like it was created specifically for the user.
