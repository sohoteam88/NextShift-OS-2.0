# PRODUCT-004 Activation Engine PRD

Version: V8

Status: P0 Growth Critical

Owner: Product Growth Team

## Depends On

- PRODUCT-001 First User Experience
- PRODUCT-002 Personalization Engine
- PRODUCT-003 Localization System
- COO-005 Mission Generator V2
- EXEC-001 Mission Execution Workspace
- EXEC-006 Multi-Mission Orchestration

## Mission

Ensure new users reach their first meaningful value as quickly as possible.

The Activation Engine answers: how do we move a new user from signup to success?

## Core Philosophy

Signups are not success. Activation is success.

Bad flow:

- User registers.
- User never returns.

Good flow:

- User registers.
- User completes first mission.
- User generates first asset.
- User experiences first outcome.

## Activation Definition

A user is activated when they experience their first meaningful result.

Examples:

- Generated first asset
- Completed first mission
- Received first lead
- Published first content
- Created first funnel

## Activation Funnel

1. `SIGNUP`
2. `AI_INTERVIEW`
3. `BUSINESS_ANALYSIS`
4. `FIRST_MISSION`
5. `FIRST_ASSET`
6. `FIRST_OUTCOME`
7. `ACTIVATED`

## Activation Engine

Purpose:

- Track every activation step.
- Identify drop-offs.
- Trigger interventions.

```ts
interface ActivationState {
  currentStep: ActivationStep;
  completionPercentage: number;
  blockedReason?: string;
  activated: boolean;
}
```

## Activation Rules

| Step | Completion Rule |
| --- | --- |
| `SIGNUP` | Account created |
| `AI_INTERVIEW` | Interview completed |
| `BUSINESS_ANALYSIS` | Business State generated |
| `FIRST_MISSION` | Mission started |
| `FIRST_ASSET` | Asset generated |
| `FIRST_OUTCOME` | Outcome verified |
| `ACTIVATED` | Value realized |

## First Value Definition

Purpose: define measurable value.

Examples:

- Lead magnet generated
- Content published
- Landing page generated
- Offer created
- First lead captured

Rule: first value must be visible.

## Activation Score

Internal only.

Measures progress through the activation funnel.

Rule: never show activation score directly to users.

## Activation Dashboard

Display:

- Current step
- Progress
- Next action
- Time to activation

Example:

- Current Step: `FIRST_MISSION`
- Progress: `57%`
- Next Action: `Generate First Asset`

## Drop-Off Detection

Purpose: detect stuck users.

Examples:

- Interview started but not completed within 24 hours -> drop-off.
- Mission assigned but not started within 48 hours -> drop-off.
- Asset generated but not reviewed within 72 hours -> drop-off.

## Intervention Engine

Purpose: re-engage users.

Triggers:

- Activation stalled
- Mission ignored
- Asset not reviewed
- Outcome not reached

Actions:

- Email
- In-app prompt
- Mission reminder
- AI COO recommendation

## Personalized Activation

Source: Personalization Engine.

Examples:

- Weight loss user -> weight-loss first asset.
- Business opportunity user -> lead-generation first asset.

## Localization

All activation messages must use Localization Engine.

Rule: activation language follows user locale.

## Activation Metrics

Track:

- Signup Rate
- Interview Completion Rate
- Mission Start Rate
- Asset Generation Rate
- Outcome Achievement Rate
- Activation Rate

## Success Targets

- Interview Completion: 80%
- Mission Start: 75%
- First Asset: 70%
- First Outcome: 50%
- Activation Rate: 40%

## Activation Timeline

- First value: under 10 minutes
- First asset: under 1 minute
- First outcome: within first session

## Activation Workspace

Display:

- Current activation step
- Remaining steps
- Expected outcome
- Next milestone

Rule: users always know what happens next.

## Audit Logging

Store:

- `activation.step.completed`
- `activation.stalled`
- `activation.recovered`
- `activation.completed`

Fields:

- User
- Step
- Timestamp
- Time to complete

## Acceptance Criteria

- Activation state exists.
- Activation funnel is tracked.
- Drop-off detection exists.
- Intervention triggers exist.
- Activation metrics exist.
- Localization is supported.
- Personalization is supported.
- Type-check passes.
- Build passes.

## Final Principle

Activation is the bridge between product promise and product value.

The product should never leave a new user wondering what to do next.
