## CAP-004 S-004 Planning

Status: Planning

Capability: CAP-004 Campaign

Slice: S-004 Campaign Scheduling

---

## Prerequisites

Completed:

- CAP-004 S-001 Campaign Foundation
- CAP-004 S-002 Campaign Application Services
- CAP-004 S-003 Campaign Integration Events

## Reference Capabilities

- CAP-001 Business Profile v1.0 (Frozen)
- CAP-002 CRM v1.0 (Released)
- CAP-003 Content v1.0 (Released)

---

## Engineering Baseline

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1
- Continuous Engineering Mode (CEM v2)

---

## Objective

Introduce campaign scheduling as an application capability, enabling campaigns to be scheduled for future activation while remaining independent of runtime schedulers and external job systems.

This slice establishes scheduling semantics and orchestration only. Actual background execution remains outside the scope of this implementation.

---

## Functional Scope

Implement:

- CampaignSchedule aggregate support, or scheduling value model if consistent with existing architecture
- Scheduling application workflows
- Schedule validation
- Schedule query support
- Scheduling domain events where appropriate
- Public exports
- Domain and application unit tests

---

## Functional Requirements

Support:

- Schedule campaign launch
- Reschedule launch
- Cancel scheduled launch
- Retrieve campaign schedule
- List pending scheduled campaigns

Validation rules:

- Scheduled launch time must be in the future
- Archived campaigns cannot be scheduled
- Completed campaigns cannot be scheduled
- Only one active launch schedule per campaign

---

## Out of Scope

- Cron
- Background workers
- Job queues
- Distributed scheduling
- External event buses
- Notification delivery
- Analytics
- Automation execution

---

## Deliverables

```text
packages/domain/
  src/campaign/
    campaign-schedule.ts
```

```text
packages/application/
  src/campaign/
    campaign-scheduling-application-service.ts

  test/
    campaign-scheduling-application-service.test.ts
```

Update:

- Public package exports
- Existing campaign module barrels where required

---

## Acceptance Criteria

- Campaign scheduling model implemented
- Scheduling workflows implemented
- Validation rules enforced
- Public exports complete
- Domain tests pass
- Application tests pass
- Typecheck passes
- No runtime redesign
- No governance redesign

---

## Exit Criteria

Upon successful verification, proceed to:

```text
CAP-004 S-004 Implementation
```
