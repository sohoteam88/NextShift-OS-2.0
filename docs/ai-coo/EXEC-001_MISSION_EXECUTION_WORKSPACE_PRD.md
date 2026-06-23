# EXEC-001 Mission Execution Workspace PRD

Version: V8

Status: P0 Critical

Owner: AI COO System

## Depends On

- COO-005 Mission Generator V2 PRD
- HOTFIX-007 Real Completion Verification
- COO-004 Explainability Engine PRD

## Mission

Create a dedicated workspace where users execute AI COO missions.

Dashboard tells users what to do. Mission Workspace helps users actually do it.

## Core Philosophy

Dashboard = Decision

Workspace = Execution

## Primary Goal

Reduce the gap between recommended and completed.

Target flow:

1. AI COO recommends one mission.
2. User starts mission from Dashboard.
3. User lands in Mission Workspace.
4. User executes steps.
5. Completion is verified by real checks.
6. Next mission is generated after verified completion.

## Workspace Route

Mission workspaces use:

```text
/mission/:missionId
```

Example:

```text
/mission/mission-plan-lead_magnet
```

## Workspace Layout

Header:

- Mission overview
- Current progress
- Verification status

Body:

- Mission steps
- Required assets
- Generated assets
- Agent support

Footer:

- Completion checks
- Next milestone

## Mission Overview

Display:

- Objective
- Description
- Estimated time
- Mission type
- Priority
- Current status

## Progress Section

Display:

- Completion percentage
- Current step
- Completed steps
- Remaining steps

## Mission Steps

Display all `MissionPlan.steps`.

Step states:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `BLOCKED`

Rule:

Users may only mark a step complete. Users may not manually mark the mission complete.

Mission completion is verified separately by `MissionCompletionVerifier`.

## Required Assets

Show the assets required to complete the mission.

Example for lead magnet:

- Lead Magnet Asset
- Landing Page
- CTA

Asset statuses:

- `ready`
- `missing`
- `generated`

## Generated Assets

Generated assets appear inside the workspace so users do not have to leave the execution context.

Examples:

- Lead Magnet
- Landing Page
- Content Draft
- Sales Script
- Offer

## Agent Support Panel

Agents assist execution without overriding the mission.

Examples:

- Content Agent: Generate Lead Magnet Content
- Funnel Agent: Create Landing Page
- Traffic Agent: Recommend Traffic Sources

## Completion Verification

Display verifier output:

- Passed checks
- Failed checks
- Next required check
- Verification status

Verification states:

- `PENDING`
- `VERIFYING`
- `COMPLETED`
- `BLOCKED`
- `FAILED`

## Dashboard Integration

Dashboard becomes the mission launcher.

The primary Dashboard mission CTA routes to `/mission/:missionId`.

The Workspace owns execution and links to the underlying source tool when needed.

## Audit Logging

Store:

- Mission Opened
- Step Started
- Step Completed
- Asset Generated
- Verification Passed
- Verification Failed
- Mission Completed

## Acceptance Criteria

- Mission Workspace exists.
- MissionPlan is rendered.
- Progress is rendered.
- Steps are rendered.
- Completion checks are rendered.
- Verification status is rendered.
- Assets are rendered.
- Agent support is rendered.
- Next milestone is rendered.
- Dashboard launches workspace.
- Type-check passes.
- Build passes.

