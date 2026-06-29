# Business Profile Use Cases

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the application use cases for the Business Profile capability.

Business Profile is the first capability that provides real business information to initialize and continuously improve the Business Twin.

These use cases describe business behavior.

They do not define implementation details.

## Guiding Principle

Business Profile is not a CRUD module.

Business Profile is the first conversation between the entrepreneur and the AI Business Partner.

Every interaction should improve business understanding.

## Primary Actor

Entrepreneur

Supporting actors:

- AI Business Partner
- Business Brain
- Application Layer

## Business Goal

Help the AI accurately understand the business.

The quality of every future recommendation depends on the quality of this understanding.

## Core Use Cases

### UC-001 Create Business Profile

Goal:

Initialize a new Business Profile.

Trigger:

A new business is created.

Flow:

1. User starts Business Profile setup.
2. AI asks guided onboarding questions.
3. User provides business information.
4. Application validates the profile.
5. Business Brain initializes the Business Twin.
6. Business Profile is stored.
7. `BusinessProfileCreated` event is published.

Outcome:

The Business Twin is initialized.

### UC-002 Update Business Profile

Goal:

Improve business understanding over time.

Trigger:

The entrepreneur updates business information.

Flow:

1. User edits one or more profile sections.
2. AI validates consistency.
3. Business Brain updates the Business Twin.
4. Business Memory records the change.
5. `BusinessProfileUpdated` event is published.

Outcome:

Business understanding improves.

### UC-003 AI Guided Completion

Goal:

Help the entrepreneur complete missing information.

Trigger:

Profile completeness falls below the required threshold.

Flow:

1. AI evaluates completeness.
2. Missing areas are identified.
3. AI recommends the next information to provide.
4. User reviews and responds.
5. Business Profile is updated.

Outcome:

Profile completeness increases.

### UC-004 Business Identity Review

Goal:

Allow the entrepreneur to review how the AI understands the business.

Trigger:

User requests Business Profile summary.

Flow:

1. Business Brain retrieves Business Profile.
2. AI generates a business summary.
3. User reviews the summary.
4. User confirms or corrects understanding.
5. Corrections update the Business Twin.

Outcome:

Shared understanding improves.

### UC-005 Brand Identity Refinement

Goal:

Improve Brand DNA.

Trigger:

Brand positioning changes.

Flow:

1. User updates Brand information.
2. AI detects inconsistencies.
3. AI recommends improvements.
4. User decides.
5. Brand DNA is updated.

Outcome:

Brand understanding becomes more accurate.

### UC-006 Business Goal Alignment

Goal:

Keep Business Goals aligned with current business strategy.

Trigger:

Goals change.

Flow:

1. User updates goals.
2. AI reviews current recommendations.
3. AI detects conflicts.
4. AI recommends adjustments.
5. Business Profile is updated.

Outcome:

Future recommendations align with current business objectives.

## AI Responsibilities

The AI should:

- Ask intelligent questions.
- Detect incomplete information.
- Detect inconsistencies.
- Explain recommendations.
- Learn from user corrections.

The AI should not:

- Invent business information.
- Modify Business Profile without user approval.

## Events

The capability may publish:

- `BusinessProfileCreated`
- `BusinessProfileUpdated`
- `BrandProfileUpdated`
- `CustomerProfileUpdated`
- `BusinessGoalsUpdated`
- `BusinessProfileCompletenessChanged`

The capability may consume:

- `BusinessCreated`
- `BusinessImported`

## Runtime Interaction

```text
User
  -> Application
  -> Business Brain
  -> Business Twin
  -> Events
  -> Learning System
```

Business Profile never bypasses the Core Runtime.

## Application Specification

The command, query, orchestrator, and transaction boundaries for these use cases are defined in [Business Profile Application Specification](BUSINESS_PROFILE_APPLICATION_SPEC.md).

## Success Criteria

The capability succeeds when:

- The AI accurately understands the business.
- The Business Twin reflects current business reality.
- Business Profile completeness continuously improves.
- Recommendations become more relevant over time.

## Out Of Scope

This capability does not:

- Manage CRM contacts.
- Launch campaigns.
- Generate marketing content.
- Execute automations.
- Handle customer communications.

These belong to future capabilities.

## Future Expansion

Future capabilities will consume Business Profile:

- CRM
- Content
- Campaign
- Revenue
- Analytics
- AI Coach

Business Profile remains the authoritative source of business identity.

## Guiding Principle

Understanding the business is the first capability.

Every future capability depends on it.
