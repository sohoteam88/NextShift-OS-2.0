# PRODUCT-001 First User Experience PRD

## Purpose

Ensure a completely new user experiences meaningful value within 10 minutes.

The product must answer four user questions:

- What do I do?
- Why should I do it?
- Can you help me?
- Did I make progress?

## First User Journey

Landing

Sign Up

AI Interview

Business Analysis

First Mission

Mission Workspace

Agent Assisted Completion

First Success

## User States

- `NEW`: account exists, user needs a clear first action
- `ONBOARDING`: user is completing the interview
- `ACTIVE`: first mission is available
- `VALUE_REALIZED`: user has received a tangible generated asset or first win
- `RETAINED`: user returns and continues progress

## First Value Moment

First value is achieved when the user receives something tangible, such as:

- Lead Magnet Draft
- Content Draft
- Landing Page Draft
- Offer Draft
- CRM Sequence

Targets:

- time to first value: under 10 minutes
- time to first asset: under 60 seconds

## Product Rules

- Show outcome before process.
- Progress must be visible everywhere.
- Use business language, not internal architecture labels.
- Every empty state must answer what happens next.
- First mission must be achievable from the workspace.
- Agent support must show Generate, Preview, and Approve actions.

## Implementation

`FirstUserExperienceService` creates a product-level projection for:

- dashboard first-user state
- next action
- first value progress
- expected value
- empty-state CTA
- workspace value-realized state from generated draft assets

Mission Workspace and Dashboard use the projection to show first-value progress in user-facing language.

## Forbidden User-Facing Terms In First User Flow

- Business State Engine
- Priority Engine
- Verification Layer
- Outcome Orchestrator
- Mission Engine Failure
- Execution Levels
- Guardrail Metadata
- Agent IDs

## Acceptance

- New user flow exists.
- Progress is visible.
- First asset can be generated from the workspace.
- First value moment is defined.
- Workspace shows success/value state when a draft asset exists.
- Celebration/value language exists.
- First-user Dashboard and Workspace do not expose architecture jargon.
- Type-check and build pass.
