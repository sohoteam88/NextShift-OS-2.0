# Event Architecture

Version: 1.0

Status: Approved

## Purpose

This document defines the Event Architecture of NextShift OS.

Events represent meaningful changes within the business.

They form the chronological history of business activity and provide the foundation for Business Memory, Story Vault, Learning, Analytics, and AI reasoning.

NextShift is an event-aware platform.

It understands businesses through events rather than isolated database records.

## Mission

The mission of the Event Architecture is to capture every meaningful business change as a reusable source of intelligence.

Events provide context.

Context enables understanding.

Understanding enables better decisions.

## Core Principle

Businesses evolve through events.

The Business Twin evolves by interpreting those events.

The database stores state.

Events explain how the state was reached.

## Architecture Position

```text
Business Activity
  -> Business Event
  -> Event Bus
  -> Story Vault / Business Memory
  -> Business Twin
  -> Decision Brain
```

Events are the foundation of business understanding.

## Definition

A Business Event is a meaningful occurrence that changes business understanding.

Events describe what happened.

Interpretation determines what it means.

## Event Characteristics

Every Business Event should include:

- Event ID
- Event Type
- Timestamp
- Source
- Business Context
- Related Entities
- Actor
- Metadata
- Correlation ID
- Causation ID

Events should be immutable.

They represent historical facts.

## Event Categories

### Business Events

Examples:

- BusinessCreated
- GoalUpdated
- StrategyChanged

### Customer Events

Examples:

- LeadCreated
- CustomerRegistered
- CustomerPurchased
- CustomerCancelled

### Marketing Events

Examples:

- CampaignLaunched
- CampaignPaused
- AdvertisementPublished

### Sales Events

Examples:

- QuoteCreated
- PaymentReceived
- OfferAccepted

### Content Events

Examples:

- ArticlePublished
- VideoGenerated
- LandingPageCreated

### Decision Events

Examples:

- RecommendationGenerated
- DecisionApproved
- DecisionRejected

### Execution Events

Examples:

- WorkflowStarted
- WhatsAppSent
- EmailDelivered
- AutomationExecuted

### Learning Events

Examples:

- ReflectionCompleted
- LearningRecorded
- BusinessTwinUpdated

## Event Lifecycle

```text
Business Activity
  -> Event Created
  -> Event Published
  -> Subscribers Process Event
  -> Business Twin Updated
  -> Learning Generated
```

Events should be processed asynchronously whenever possible.

## Story Creation

Not every event becomes a Story.

Multiple related events may be combined into a Story.

Example:

```text
LeadCreated
  -> EmailOpened
  -> MeetingBooked
  -> OfferAccepted
  -> Story: Enterprise Customer Acquisition
```

Stories preserve business narrative rather than isolated actions.

## Business Memory

Business Memory should store:

- Significant events
- Decisions
- Outcomes
- Lessons
- Preferences

Memory is built from important events.

## Event Bus

The Event Bus distributes business events to interested components.

Subscribers may include:

- Business Brain
- Learning System
- Analytics
- AI Coach
- Notification System
- CRM
- Knowledge Graph

The publisher should not depend on subscribers.

## Architectural Rules

### Rule 1

Events are immutable.

### Rule 2

Events represent facts.

Interpretation belongs to higher layers.

### Rule 3

Events should never contain business conclusions.

They describe what happened.

### Rule 4

Every significant decision should generate an event.

### Rule 5

Every meaningful execution should generate an event.

### Rule 6

Events should strengthen the Business Twin.

### Rule 7

Business stories are composed from events.

Stories are not raw event logs.

## Success Criteria

The Event Architecture succeeds when:

- Business history is preserved.
- Learning becomes traceable.
- Business Twin evolves naturally.
- Analytics gains historical context.
- AI reasoning improves through event history.
- New capabilities integrate through events rather than direct coupling.

## Guiding Principle

State tells us where the business is.

Events tell us how it got there.

Understanding requires both.
