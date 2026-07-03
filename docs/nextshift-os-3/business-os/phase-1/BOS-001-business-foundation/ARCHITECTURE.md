# BOS-001 Business Foundation Architecture

## Purpose

This document defines the documentation architecture for consolidating CAP-001 through CAP-008 into the Business OS foundation.

## Architecture Principle

BOS-001 does not replace existing capability documentation. It organizes the existing capability set into one Business OS foundation so later BOS phases can depend on a shared business context, execution model, and intelligence layer.

## Foundation Layers

| Layer | Capability | Role |
| --- | --- | --- |
| Business Identity | CAP-001 Business Profile | Defines the business entity, goals, brand, offer, and business understanding. |
| Customer Intelligence | CAP-002 CRM | Defines customer records, lifecycle, segmentation, follow-up, and relationship context. |
| Content Operations | CAP-003 Content | Defines content assets, planning, calendar, variants, performance, insights, recommendations, and execution. |
| Campaign Operations | CAP-004 Campaign | Defines campaign planning, structure, release, and verification records. |
| Revenue Intelligence | CAP-005 Revenue Forecast | Defines revenue domain, application foundation, targets, and forecast planning. |
| Performance Intelligence | CAP-006 Analytics | Reserves analytics as the measurable business performance layer. |
| Decision Intelligence | CAP-007 Decision Brain | Reserves decision intelligence as the recommendation and prioritization layer. |
| Business Intelligence Core | CAP-008 Business Brain | Defines business understanding, health, opportunity detection, insight engine, knowledge graph, services, and integration events. |

## Ownership Model

Capabilities retain their source documentation and lifecycle records under `docs/nextshift-os-3/capabilities/`.

Business OS owns:

- Cross-capability consolidation
- Business foundation navigation
- Capability dependency mapping
- Integration readiness for BOS-002
- Documentation-only governance for Business OS Phase 1

## Integration Boundary

BOS-001 introduces:

- No runtime routes
- No API changes
- No schema changes
- No refactoring
- No implementation changes

## Architecture Output

BOS-001 creates a single documentation entry point for the Business Foundation so BOS-002 can build Decision Intelligence on top of the existing capability base.
