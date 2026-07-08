## MASTER_INDEX

Version: 1.0

Status: Current

Last Updated: 2026-06-26

---

## Purpose

This document is the master navigation entry for all NextShift OS documentation.

Unlike the project README, which introduces the platform, the Master Index provides structured navigation across the complete documentation system.

Every authoritative document should be reachable from this index.

---

## Recommended Reading Order

For fresh AI chat windows:

- [ChatGPT System Context](../chatgpt-system-context/README.md)
- [Docs Hygiene](docs-hygiene/README.md)

For first-time contributors:

1. [README](README.md)
2. [Blueprint Status](BLUEPRINT_STATUS.md)
3. [NextShift Reference Architecture](phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md)
4. [Runtime Status](RUNTIME_STATUS.md)
5. [Capability Status](CAPABILITY_STATUS.md)
6. [Engineering Standards](engineering/ENGINEERING_STANDARDS.md)
7. [Engineering Playbook](engineering/ENGINEERING_PLAYBOOK.md)
8. [Reference Capability](capabilities/REFERENCE_CAPABILITY.md)

After completing the above:

- Capability documentation
- Platform project documentation
- Sprint documentation
- Engineering documentation

---

## Project Dashboard

| Area                 | Status          |
| -------------------- | --------------- |
| Blueprint            | Complete        |
| Core Runtime         | Complete        |
| Reference Capability | CAP-001         |
| Current Capability   | CAP-005 S-004 Implementation |
| Design System        | Released        |
| UI Kit               | UK-001 Planning |

---

## Blueprint

Core documents:

- [NextShift OS 3.0 Blueprint](NEXTSHIFT_OS_3_BLUEPRINT.md)
- [Blueprint Status](BLUEPRINT_STATUS.md)
- [NextShift Reference Architecture](phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md)

Supporting:

- [Current Constitution](constitution/README.md)
- [Product Philosophy](phase-0-foundation/0.8_PRODUCT_PHILOSOPHY.md)
- [AI Operating Loop](phase-0-foundation/0.3_AI_OPERATING_LOOP.md)

---

## Core Runtime

Status:

- [Runtime Status](RUNTIME_STATUS.md)

Packages:

- `shared`
- `contracts`
- `event-bus`
- `business-brain`
- `decision-brain`
- `execution-layer`
- `learning-system`
- `domain`
- `application`
- `agents`
- `capability-layer`

Engineering:

- [Implementation Cycle](engineering/IMPLEMENTATION_CYCLE.md)

---

## Capability Governance

Status:

- [Capability Status](CAPABILITY_STATUS.md)

Reference:

- [Capability Release](capabilities/CAPABILITY_RELEASE.md)
- [Release Tags](capabilities/RELEASE_TAGS.md)
- [Reference Capability](capabilities/REFERENCE_CAPABILITY.md)
- [Capability Retrospective](capabilities/CAPABILITY_RETROSPECTIVE.md)

Engineering Knowledge:

- [Lessons Learned CAP-001](capabilities/LESSONS_LEARNED_CAP_001.md)

---

## Platform Projects

Design System:

- [NextShift Design System v1.0](design-system/README.md)
- [Design System Project Planning](design-system/PROJECT_PLANNING.md)
- [Design System Project Release](design-system/PROJECT_RELEASE.md)
- [Design System Project Release Notes](design-system/PROJECT_RELEASE_NOTES.md)

UI Kit:

- [NextShift UI Kit v1.0](ui-kit/README.md)
- [UI Kit Project Planning](ui-kit/PROJECT_PLANNING.md)
- [UK-001 Design Language Planning](ui-kit/slices/UK-001-design-language/PLANNING.md)

Developer Platform:

- [Developer Platform](developer-platform/README.md)
- [Developer Platform Review](developer-platform/review/DEVELOPER_PLATFORM_REVIEW.md)
- [Automation Workflow Review](developer-platform/review/AUTOMATION_WORKFLOW_REVIEW.md)
- [Engineering Playbook v1.2 Recommendation](developer-platform/review/ENGINEERING_PLAYBOOK_V1_2_RECOMMENDATION.md)
- [Developer Platform v1.1 Workflow Hardening](developer-platform-v1.1/README.md)

---

## CAP-001 Business Profile

Capability Definition:

- [CAP-001 Business Profile](capabilities/CAPABILITY_001_BUSINESS_PROFILE.md)

Supporting Specifications:

- [Business Profile Domain Model](capabilities/BUSINESS_PROFILE_DOMAIN_MODEL.md)
- [Business Profile Use Cases](capabilities/BUSINESS_PROFILE_USE_CASES.md)
- [Business Profile Events](capabilities/BUSINESS_PROFILE_EVENTS.md)
- [Business Profile Application Specification](capabilities/BUSINESS_PROFILE_APPLICATION_SPEC.md)
- [Business Profile API Specification](capabilities/BUSINESS_PROFILE_API_SPEC.md)
- [Business Profile UI Flow](capabilities/BUSINESS_PROFILE_UI_FLOW.md)

Implementation:

- [Implementation Cycle CAP-001](capabilities/IMPLEMENTATION_CYCLE_CAP_001.md)

Slices:

- [Implementation Slice 001 - Business Identity](capabilities/IMPLEMENTATION_SLICE_001_BUSINESS_IDENTITY.md)
- [Implementation Slice 002 - Brand DNA](capabilities/IMPLEMENTATION_SLICE_002_BRAND_DNA.md)
- [Implementation Slice 003 - Offer Profile](capabilities/IMPLEMENTATION_SLICE_003_OFFER_PROFILE.md)
- [Implementation Slice 004 - Customer Intelligence](capabilities/IMPLEMENTATION_SLICE_004_CUSTOMER_INTELLIGENCE.md)
- [Implementation Slice 005 - Business Goals](capabilities/IMPLEMENTATION_SLICE_005_BUSINESS_GOALS.md)
- [Implementation Slice 006 - Business Understanding](capabilities/IMPLEMENTATION_SLICE_006_BUSINESS_UNDERSTANDING.md)
- [Implementation Slice 007 - Business Twin Activation](capabilities/IMPLEMENTATION_SLICE_007_BUSINESS_TWIN_ACTIVATION.md)

Release:

- [Capability Release](capabilities/CAPABILITY_RELEASE.md)
- [Release Tags](capabilities/RELEASE_TAGS.md)
- [Capability Retrospective](capabilities/CAPABILITY_RETROSPECTIVE.md)

---

## CAP-002 CRM

Capability Definition:

- [CAP-002 CRM Domain Model](capabilities/CAP-002_CRM_DOMAIN_MODEL.md)
- [CAP-002 CRM Use Cases](capabilities/CAP-002_CRM_USE_CASES.md)
- [CAP-002 CRM Events](capabilities/CAP-002_CRM_EVENTS.md)
- [CAP-002 CRM Application Specification](capabilities/CAP-002_CRM_APPLICATION_SPEC.md)
- [CAP-002 CRM Implementation Slices](capabilities/CAP-002_CRM_IMPLEMENTATION_SLICES.md)
- [CAP-002 CRM Pre-Implementation Resolution](capabilities/CAP-002_CRM_PRE_IMPLEMENTATION_RESOLUTION.md)
- [CAP-002 S-001 Customer Foundation Build Specification](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_BUILD_SPECIFICATION.md)
- [CAP-002 S-001 Customer Foundation Implementation Tasks](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_IMPLEMENTATION_TASKS.md)
- [CAP-002 S-001 Customer Foundation Implementation Report](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-001 Customer Foundation Verification Checklist](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-001 Customer Foundation Release Notes](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_RELEASE_NOTES.md)
- [CAP-002 S-001 Customer Foundation Audit Report](../../audit/CAP_002_S001_CUSTOMER_FOUNDATION_AUDIT_REPORT.md)
- [CAP-002 S-002 Lead Management Build Specification](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_BUILD_SPECIFICATION.md)
- [CAP-002 S-002 Lead Management Implementation Tasks](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_IMPLEMENTATION_TASKS.md)
- [CAP-002 S-002 Lead Management Implementation](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_IMPLEMENTATION.md)
- [CAP-002 S-002 Lead Management Implementation Report](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-002 Lead Management Verification Checklist](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-003 Interaction Timeline Build Specification](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_BUILD_SPECIFICATION.md)
- [CAP-002 S-003 Interaction Timeline Implementation](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_IMPLEMENTATION.md)
- [CAP-002 S-003 Interaction Timeline Implementation Report](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-003 Interaction Timeline Verification Checklist](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-003 Interaction Timeline Release Notes](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_RELEASE_NOTES.md)
- [CAP-002 S-004 Follow-Up Management Build Specification](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_BUILD_SPECIFICATION.md)
- [CAP-002 S-004 Follow-Up Management Implementation](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_IMPLEMENTATION.md)
- [CAP-002 S-004 Follow-Up Management Implementation Report](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-004 Follow-Up Management Verification Checklist](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-004 Follow-Up Management Release Notes](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_RELEASE_NOTES.md)
- [CAP-002 S-005 Customer Segmentation Build Specification](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_BUILD_SPECIFICATION.md)
- [CAP-002 S-005 Customer Segmentation Implementation Report](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-005 Customer Segmentation Verification Checklist](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-005 Customer Segmentation Release Notes](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_RELEASE_NOTES.md)
- [CAP-002 S-006 Search & Query Build Specification](capabilities/CAP-002_S-006_SEARCH_QUERY_BUILD_SPECIFICATION.md)
- [CAP-002 S-006 Search & Query Implementation Report](capabilities/CAP-002_S-006_SEARCH_QUERY_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-006 Search & Query Verification Checklist](capabilities/CAP-002_S-006_SEARCH_QUERY_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-006 Search & Query Release Notes](capabilities/CAP-002_S-006_SEARCH_QUERY_RELEASE_NOTES.md)
- [CAP-002 S-007 Import & Export Build Specification](capabilities/CAP-002_S-007_IMPORT_EXPORT_BUILD_SPECIFICATION.md)
- [CAP-002 S-007 Import & Export Implementation Report](capabilities/CAP-002_S-007_IMPORT_EXPORT_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-007 Import & Export Verification Checklist](capabilities/CAP-002_S-007_IMPORT_EXPORT_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-007 Import & Export Release Notes](capabilities/CAP-002_S-007_IMPORT_EXPORT_RELEASE_NOTES.md)
- [CAP-002 S-008 CRM Integration Events Build Specification](capabilities/CAP-002_S-008_CRM_INTEGRATION_EVENTS_BUILD_SPECIFICATION.md)
- [CAP-002 S-008 CRM Integration Events Implementation Report](capabilities/CAP-002_S-008_CRM_INTEGRATION_EVENTS_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-008 CRM Integration Events Verification Checklist](capabilities/CAP-002_S-008_CRM_INTEGRATION_EVENTS_VERIFICATION_CHECKLIST.md)
- [CAP-002 CRM Release](capabilities/CAP-002_CRM_RELEASE.md)

Status:

```text
Released
```

Current Completed Slice:

```text
CAP-002 S-008 CRM Integration Events
```

S-001 Audit:

```text
PASS
```

S-001 Release:

```text
Approved
```

Next Phase:

```text
CAP-003
```

---

## CAP-003 Content

Capability Planning:

- [CAP-003 Content Planning](capabilities/CAP-003_CONTENT_PLANNING.md)
- [CAP-003 S-001 Content Asset Foundation Verification Checklist](capabilities/CAP-003_S-001_CONTENT_ASSET_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-002 Content Calendar Foundation Verification Checklist](capabilities/CAP-003_S-002_CONTENT_CALENDAR_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-003 Content Plan Foundation Verification Checklist](capabilities/CAP-003_S-003_CONTENT_PLAN_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-004 Content Variant Foundation Verification Checklist](capabilities/CAP-003_S-004_CONTENT_VARIANT_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-005 Content Performance Foundation Verification Checklist](capabilities/CAP-003_S-005_CONTENT_PERFORMANCE_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-006 Content Insight Foundation Verification Checklist](capabilities/CAP-003_S-006_CONTENT_INSIGHT_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-006 Content Insight Foundation Release Notes](capabilities/CAP-003_S-006_CONTENT_INSIGHT_FOUNDATION_RELEASE_NOTES.md)
- [CAP-003 S-007 Content Recommendation Foundation Verification Checklist](capabilities/CAP-003_S-007_CONTENT_RECOMMENDATION_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-007 Content Recommendation Foundation Release Notes](capabilities/CAP-003_S-007_CONTENT_RECOMMENDATION_FOUNDATION_RELEASE_NOTES.md)
- [CAP-003 S-008 Content Execution Foundation Verification Checklist](capabilities/CAP-003_S-008_CONTENT_EXECUTION_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-008 Content Execution Foundation Release Notes](capabilities/CAP-003_S-008_CONTENT_EXECUTION_FOUNDATION_RELEASE_NOTES.md)
- [CAP-003 Content Capability Verification Checklist](capabilities/CAP-003_CONTENT_CAPABILITY_VERIFICATION_CHECKLIST.md)
- [CAP-003 Content Release](capabilities/CAP-003_CONTENT_RELEASE.md)

Status:

```text
Released
```

Next Phase:

```text
CAP-004 Campaign Planning
```

---

## CAP-004 Campaign

Capability Planning:

- [CAP-004 S-001 Planning](capabilities/CAP-004_S-001_PLANNING.md)
- [CAP-004 S-001 Verification Report](capabilities/CAP-004_S-001_VERIFICATION_REPORT.md)
- [CAP-004 S-001 Slice Release](capabilities/CAP-004_S-001_SLICE_RELEASE.md)
- [CAP-004 S-002 Planning](capabilities/CAP-004_S-002_PLANNING.md)
- [CAP-004 S-002 Verification Report](capabilities/CAP-004_S-002_VERIFICATION_REPORT.md)
- [CAP-004 S-002 Slice Release](capabilities/CAP-004_S-002_SLICE_RELEASE.md)
- [CAP-004 S-003 Planning](capabilities/CAP-004_S-003_PLANNING.md)
- [CAP-004 S-003 Verification Report](capabilities/CAP-004_S-003_VERIFICATION_REPORT.md)
- [CAP-004 S-003 Slice Release](capabilities/CAP-004_S-003_SLICE_RELEASE.md)
- [CAP-004 S-004 Planning](capabilities/CAP-004_S-004_PLANNING.md)
- [CAP-004 S-004 Verification Report](capabilities/CAP-004_S-004_VERIFICATION_REPORT.md)
- [CAP-004 S-004 Slice Release](capabilities/CAP-004_S-004_SLICE_RELEASE.md)
- [CAP-004 S-005 Planning](capabilities/CAP-004_S-005_PLANNING.md)
- [CAP-004 S-005 Verification Report](capabilities/CAP-004_S-005_VERIFICATION_REPORT.md)
- [CAP-004 S-005 Slice Release](capabilities/CAP-004_S-005_SLICE_RELEASE.md)
- [CAP-004 Capability Verification Report](capabilities/CAP-004_CAPABILITY_VERIFICATION_REPORT.md)
- [CAP-004 Campaign Release](capabilities/CAP-004_CAMPAIGN_RELEASE.md)

Status:

```text
Released
```

Next Phase:

```text
CAP-005 Slice Planning
```

---

## CAP-005 Revenue

Capability Planning:

- [CAP-005 Revenue Planning](capabilities/CAP-005_REVENUE_PLANNING.md)
- [CAP-005 S-001 Planning](capabilities/CAP-005_S-001_PLANNING.md)
- [CAP-005 S-001 Revenue Domain Foundation Verification Report](capabilities/CAP-005_S-001_REVENUE_DOMAIN_FOUNDATION_VERIFICATION_REPORT.md)
- [CAP-005 S-001 Slice Release](capabilities/CAP-005_S-001_SLICE_RELEASE.md)
- [CAP-005 S-002 Planning](capabilities/CAP-005_S-002_PLANNING.md)
- [CAP-005 S-002 Revenue Application Foundation Verification Report](capabilities/CAP-005_S-002_REVENUE_APPLICATION_FOUNDATION_VERIFICATION_REPORT.md)
- [CAP-005 S-002 Slice Release](capabilities/CAP-005_S-002_SLICE_RELEASE.md)
- [CAP-005 S-003 Planning](capabilities/CAP-005_S-003_PLANNING.md)
- [CAP-005 S-003 Revenue Target Management Verification Report](capabilities/CAP-005_S-003_REVENUE_TARGET_MANAGEMENT_VERIFICATION_REPORT.md)
- [CAP-005 S-003 Slice Release](capabilities/CAP-005_S-003_SLICE_RELEASE.md)
- [CAP-005 S-004 Planning](capabilities/CAP-005_S-004_PLANNING.md)

Status:

```text
S-004 Planning
```

Next Phase:

```text
CAP-005 S-004 Implementation
```

---

## Engineering

Core:

- [Engineering Standards](engineering/ENGINEERING_STANDARDS.md)
- [Engineering Playbook](engineering/ENGINEERING_PLAYBOOK.md)
- [Engineering Playbook v1.2](engineering-playbook-v1.2/README.md)
- [Docs Hygiene](docs-hygiene/README.md)

Implementation:

- [Implementation Cycle](engineering/IMPLEMENTATION_CYCLE.md)

Implementation History:

- [Implementation Cycles](engineering/implementation-cycles/README.md)

---

## Sprint History

Sprint Dashboard:

- [Sprints](sprints/README.md)

Sprint Documents:

- [Sprint 000 - Blueprint Cleanup](sprints/SPRINT-000_BLUEPRINT_CLEANUP.md)
- [Sprint 001 - Project Skeleton](sprints/SPRINT-001_TASK-001_PROJECT_SKELETON.md)

Patch History:

- [Sprint 000 Task 005 Patch](sprints/SPRINT-000_TASK-005_PATCH.md)

---

## Repository

```text
docs/
packages/
apps/
```

Documentation:

- Blueprint
- Runtime
- Engineering
- Capabilities
- Sprints

Runtime:

- `packages/`

Applications:

- `apps/`

---

## Current Reference Capability

Reference Capability:

```text
CAP-001 Business Profile
```

Current Status:

```text
Frozen
```

All future capabilities should follow the engineering and architectural patterns established by CAP-001 unless superseded by an approved architectural decision.

---

## Current Roadmap

Completed:

- Blueprint
- Runtime
- CAP-001 Business Profile

Current:

```text
CAP-002 CRM
```

Future:

- Content
- Campaign
- Revenue
- Analytics
- AI Coach

---

## Navigation Principles

The documentation system follows four levels:

```text
README
        |
        v
MASTER_INDEX
        |
        v
Status Dashboards
        |
        v
Detailed Specifications
```

Use:

- README to understand the project.
- MASTER_INDEX to locate documentation.
- Status dashboards to understand current progress.
- Detailed specifications for implementation.

---

## Guiding Principle

Documentation should be discoverable, structured, and authoritative.

Every important engineering decision should be traceable through the documentation hierarchy.
