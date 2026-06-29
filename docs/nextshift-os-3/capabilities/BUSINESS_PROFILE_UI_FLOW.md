# Business Profile UI Flow

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the user experience flow for the Business Profile capability.

The objective is not to collect data.

The objective is to help the AI understand the business through guided conversation and structured confirmation.

The experience should feel like onboarding an AI Business Partner, not completing a form.

## UX Philosophy

Business Profile is an AI Interview.

The entrepreneur should answer meaningful business questions.

The AI should transform those answers into structured business understanding.

The user should never be asked to complete unnecessary fields.

## Primary User Journey

```text
Welcome
  -> Business Introduction
  -> AI Guided Interview
  -> Business Summary
  -> User Confirmation
  -> Business Twin Initialization
  -> Business Dashboard
```

The flow should feel conversational rather than transactional.

## Screen 1 - Welcome

Purpose: Introduce the AI Business Partner.

Primary Goal: Set expectations.

Content:

- Welcome message
- What the AI will learn
- Estimated completion time
- Start button

Primary CTA: Start Business Profile

## Screen 2 - Business Introduction

Purpose: Collect minimum identity information.

Questions:

- What is your business name?
- What does your business do?
- Where do you operate?
- Which industry are you in?

The AI should ask one question at a time.

## Screen 3 - Brand Discovery

Purpose: Understand the business identity.

Topics:

- Vision
- Mission
- Values
- Brand Voice
- Positioning

The AI should provide examples where helpful.

## Screen 4 - Offer Discovery

Purpose: Understand the value proposition.

Topics:

- Products
- Services
- Core Offer
- Customer Promise

The AI should summarize before moving on.

## Screen 5 - Customer Discovery

Purpose: Understand the target customer.

Topics:

- Who do you help?
- Biggest customer problems
- Desired outcomes
- Customer personas

The AI may ask follow-up questions.

## Screen 6 - Business Goals

Purpose: Understand current priorities.

Topics:

- Revenue goals
- Growth goals
- Biggest challenges
- Success definition

## Screen 7 - AI Business Summary

Purpose: Allow the entrepreneur to review the AI's understanding.

Display:

- Business Summary
- Brand Summary
- Customer Summary
- Goals Summary
- Completeness Score

Actions:

- Confirm
- Edit
- Continue Conversation

The AI should explicitly ask:

"Is this an accurate understanding of your business?"

## Screen 8 - Business Twin Initialization

Purpose: Initialize the Business Twin.

Display:

- Progress
- Confirmation
- Initial insights

The user should not need to understand the internal architecture.

## Screen 9 - Business Dashboard

Purpose: Transition into normal product usage.

The AI now understands:

- Who the business is.
- What it sells.
- Who it serves.
- What success looks like.

The next experience should begin with recommendations rather than setup.

## AI Conversation Guidelines

The AI should:

- Ask one question at a time.
- Avoid overwhelming the user.
- Explain why a question matters.
- Detect inconsistencies.
- Summarize frequently.
- Request confirmation before saving.

The AI should never fabricate missing information.

## Validation Flow

```text
Detect
  -> Explain
  -> Ask
  -> Confirm
  -> Update
```

The entrepreneur remains the final decision maker.

## Progress Model

Suggested progress stages:

1. Identity
2. Brand
3. Offer
4. Customer
5. Goals
6. Review
7. Complete

Display progress visually.

Avoid percentage-only indicators.

## Accessibility

The flow should support:

- Keyboard navigation
- Mobile-first interaction
- Voice input, future
- Screen readers

## Success Criteria

- The entrepreneur feels interviewed rather than interrogated.
- The AI gains sufficient context to initialize the Business Twin.
- Business understanding is confirmed by the user.
- The onboarding naturally transitions into AI recommendations.

## Out of Scope

Does not define:

- Visual design system
- Component implementation
- Front-end framework
- Animation details

Those belong to implementation.

## Guiding Principle

The first conversation with the AI should build trust.

Every question should improve understanding.

Every answer should strengthen the Business Twin.
