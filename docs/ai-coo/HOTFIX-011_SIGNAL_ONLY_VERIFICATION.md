# HOTFIX-011 Signal-Only Verification

Version: V8

Status: P0 Security + Integrity Hotfix

Owner: AI COO System

## Depends On

- HOTFIX-007 Real Completion Verification
- HOTFIX-010 Completion Check Whitelist
- EXEC-001 Mission Execution Workspace

## Problem

Mission completion must not be influenced by workspace progress, completed checks, manual progress, or user declarations.

Workspace progress answers:

- Did the user perform a step?

Business verification answers:

- Does the business capability actually exist?

These are different systems.

## Objective

Make `MissionCompletionVerifier` trust only:

- Validation Engine
- Business State Engine
- Signal Engine
- Capability/database facts

It must never trust:

- `workspace.step.*`
- `completedChecks`
- step history
- manual completion markers
- user declarations

## Core Principle

Progress is not proof.

Signals are proof.

## Verification Rules

Mission completion may come only from business reality:

- Business State
- Bottleneck signal set
- Validation status
- Database facts such as traffic, customers, content, funnel, lead magnet, CRM activity, SOP count, team count, and signal visibility

Forbidden completion sources:

- Step completed
- User click
- Manual flag
- Progress 100%
- Workspace check history

## Completion Source Matrix

| Mission Type | Verification Source |
| --- | --- |
| BRAND | AI Interview, business context, audience profile |
| POSITIONING | Positioning statement, audience pain, transformation |
| CONTENT | Content Engine, content assets, content calendar |
| LEAD_MAGNET | Lead magnet, CTA, publication status |
| FUNNEL | Landing page, thank-you page, lead route |
| TRAFFIC | Traffic source, traffic count |
| CUSTOMERS | Customer count, revenue |
| RETENTION | Retention rate, repeat purchases |
| TEAM | Agent count, SOP count, team members |
| SYSTEM | Signal visibility, validation status |

## Audit Logging

Mission completion audit metadata stores `verificationSource`.

Expected values:

- `signal`
- `unavailable`
- `manual` for legacy `MissionGeneratorV2.validateCompletion` tests only, not authority-owned completion

## Acceptance Criteria

- `MissionCompletionVerifier` reads signals only.
- No `completedChecks` logic remains in `MissionCompletionVerifier`.
- No `workspace.step.*` logic remains in `MissionCompletionVerifier`.
- Mission completion comes from business reality.
- Type-check passes.
- Build passes.
- Regression tests pass.

