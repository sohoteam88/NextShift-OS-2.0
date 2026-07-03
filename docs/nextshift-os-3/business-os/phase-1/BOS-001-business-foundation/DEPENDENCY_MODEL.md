# BOS-001 Dependency Model

## Purpose

This document defines the dependency model for the Business Foundation capability set.

## Dependency Principle

Business OS Phase 1 must build from business context outward. Decision, workflow, automation, memory, and event capabilities depend on a stable foundation of business identity, customer context, commercial context, and Business Brain intelligence.

## Dependency Chain

```text
CAP-001 Business Profile
  -> CAP-002 CRM
  -> CAP-003 Content
  -> CAP-004 Campaign
  -> CAP-005 Revenue Forecast
  -> CAP-006 Analytics
  -> CAP-007 Decision Brain
  -> CAP-008 Business Brain
```

## Dependency Roles

| Dependency | Provides | Consumed By |
| --- | --- | --- |
| CAP-001 Business Profile | Business identity, brand, offer, goals, business understanding | All BOS capabilities |
| CAP-002 CRM | Customer context and lifecycle | Content, Campaign, Revenue, Analytics, Decision Brain, Business Brain |
| CAP-003 Content | Content assets and execution context | Campaign, Analytics, Decision Brain, Business Brain |
| CAP-004 Campaign | Campaign structure and performance context | Revenue, Analytics, Decision Brain, Business Brain |
| CAP-005 Revenue Forecast | Commercial targets and revenue context | Analytics, Decision Brain, Business Brain |
| CAP-006 Analytics | Performance measurement | Decision Brain, Business Brain, Business OS Integration |
| CAP-007 Decision Brain | Recommendations, priorities, opportunity ranking | AI Workflow, Automation, Business Brain |
| CAP-008 Business Brain | Unified business understanding and intelligence | BOS-002 through BOS-008 |

## BOS-002 Dependency

BOS-002 Decision Intelligence depends on BOS-001 for:

- Business identity and goals
- Customer context
- Content and campaign activity
- Revenue context
- Analytics readiness
- Business Brain intelligence

## Boundary

This dependency model is documentation-only. It does not introduce dependency injection, package dependencies, runtime wiring, event contracts, database relationships, or API requirements.
