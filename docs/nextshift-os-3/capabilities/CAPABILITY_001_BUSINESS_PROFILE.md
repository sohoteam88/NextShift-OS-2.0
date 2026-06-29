# CAP-001 Business Profile

Version: 1.0

Status: Draft

Capability ID: CAP-001

Priority: P0

Owner: Product

## Purpose

Business Profile is the first business capability of NextShift OS.

It captures the foundational identity of a business and provides the initial structured context for the Business Twin.

Business Profile is not a profile page.

It is the identity layer of business intelligence.

## Mission

The mission of Business Profile is to answer one question:

**Who is this business?**

Every future recommendation, decision, execution, and learning process depends on this understanding.

## Business Value

Business Profile enables:

- Business Twin initialization
- AI personalization
- Brand consistency
- Customer understanding
- Recommendation quality
- Strategy alignment

Without Business Profile, the AI cannot meaningfully understand the business.

## Scope

Business Profile captures the following areas.

### Business Identity

- Business Name
- Legal Name, optional
- Industry
- Business Stage
- Country
- Time Zone

### Brand

- Brand Name
- Brand Story
- Vision
- Mission
- Core Values
- Brand Voice
- Positioning

### Offer

- Products
- Services
- Core Offer
- Value Proposition

### Customer

- Target Customer
- Customer Persona
- Customer Problems
- Desired Outcomes

### Business Goals

- Revenue Goal
- Growth Goal
- Priority Goal
- Current Challenges

## Out Of Scope

Business Profile does not manage:

- CRM contacts
- Campaigns
- Revenue tracking
- Content
- WhatsApp
- Landing Pages

Those belong to future capabilities.

## Runtime Dependencies

Business Profile depends on:

- `@nextshift/domain`
- `@nextshift/business-brain`
- `@nextshift/application`

It must not bypass the Core Runtime.

## Domain Model

The canonical domain model for this capability is defined in [Business Profile Domain Model](BUSINESS_PROFILE_DOMAIN_MODEL.md).

## Use Cases

The application use cases for this capability are defined in [Business Profile Use Cases](BUSINESS_PROFILE_USE_CASES.md).

## Events

The domain events for this capability are defined in [Business Profile Events](BUSINESS_PROFILE_EVENTS.md).

## Application Specification

The Application Layer specification for this capability is defined in [Business Profile Application Specification](BUSINESS_PROFILE_APPLICATION_SPEC.md).

## API Specification

The public API specification for this capability is defined in [Business Profile API Specification](BUSINESS_PROFILE_API_SPEC.md).

## UI Flow

The user experience flow for this capability is defined in [Business Profile UI Flow](BUSINESS_PROFILE_UI_FLOW.md).

## Implementation Plan

The engineering implementation plan for this capability is defined in [Business Profile Implementation Plan](BUSINESS_PROFILE_IMPLEMENTATION_PLAN.md).

## Implementation Cycle

The vertical-slice delivery roadmap for this capability is defined in [Implementation Cycle CAP-001](IMPLEMENTATION_CYCLE_CAP_001.md).

## Implementation Slices

The production-ready vertical slices are defined in:

- [Implementation Slice 001 - Business Identity](IMPLEMENTATION_SLICE_001_BUSINESS_IDENTITY.md)
- [Implementation Slice 002 - Brand DNA](IMPLEMENTATION_SLICE_002_BRAND_DNA.md)
- [Implementation Slice 003 - Offer Profile](IMPLEMENTATION_SLICE_003_OFFER_PROFILE.md)
- [Implementation Slice 004 - Customer Intelligence](IMPLEMENTATION_SLICE_004_CUSTOMER_INTELLIGENCE.md)
- [Implementation Slice 005 - Business Goals](IMPLEMENTATION_SLICE_005_BUSINESS_GOALS.md)

## Lessons Learned

Validated CAP-001 implementation lessons are recorded in [Lessons Learned CAP-001](LESSONS_LEARNED_CAP_001.md).

## Outputs

Business Profile populates:

- Business Twin
- Brand DNA
- Business Memory, initial
- Recommendation Context

## Success Criteria

Business Profile is successful when:

- Business identity is complete.
- AI can describe the business accurately.
- Business Twin is initialized.
- Recommendations become business-aware.

## Future Integrations

Business Profile will be consumed by:

- CRM
- Campaign
- Content
- AI Coach
- Recommendation Engine
- Strategy Engine
- Opportunity Engine

## Guiding Principle

Understanding the business comes before improving the business.
