# BOS-001 Capability Matrix

## Purpose

This matrix maps the Business OS foundation capabilities to their Business OS role, current source documentation, and integration purpose.

## Matrix

| Capability | Business OS Role | Current Source | BOS-001 Use |
| --- | --- | --- | --- |
| CAP-001 Business Profile | Business identity foundation | `docs/nextshift-os-3/capabilities/` | Provides business profile, goals, brand, offer, customer intelligence, and business twin activation inputs. |
| CAP-002 CRM | Customer intelligence foundation | `docs/nextshift-os-3/capabilities/CAP-002_*` | Provides customer records, lifecycle, interactions, follow-up, segmentation, search, import/export, and CRM integration events. |
| CAP-003 Content | Content operations foundation | `docs/nextshift-os-3/capabilities/CAP-003_*` | Provides content planning, assets, calendar, variants, performance, insights, recommendations, and execution records. |
| CAP-004 Campaign | Campaign operations foundation | `docs/nextshift-os-3/capabilities/CAP-004_*` | Provides campaign planning, verification, slice releases, and capability release records. |
| CAP-005 Revenue Forecast | Revenue intelligence foundation | `docs/nextshift-os-3/capabilities/CAP-005_*` | Provides revenue domain, application, target management, and forecasting planning records. |
| CAP-006 Analytics | Performance measurement foundation | Reserved capability documentation | Provides the planned measurement layer required for Business OS reporting and performance intelligence. |
| CAP-007 Decision Brain | Decision intelligence foundation | Phase 2 architecture and planned capability documentation | Provides the planned recommendation, prioritization, and decision pipeline layer. |
| CAP-008 Business Brain | Business intelligence core | `docs/nextshift-os-3/capabilities/cap-008-business-brain/` | Provides business understanding, health, opportunities, insights, knowledge graph foundation, application service, and integration events. |

## Consolidation Rule

BOS-001 may reference released, implemented, planned, or reserved capability documentation, but it must not change the lifecycle truth recorded by the capability owners.

## Readiness for BOS-002

BOS-001 is ready for BOS-002 when the capability matrix gives Decision Intelligence a clear dependency map for business identity, customers, content, campaigns, revenue, analytics, and Business Brain context.
