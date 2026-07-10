# ARC-004 Release Notes

Version: 1.0  
Status: Released  
Release Date: 2026-06-30

## Release

**ARC-004 -- Retail Business OS Configuration**

This release delivers the first Business Operating System — Retail — built entirely on the completed NextShift OS 3.1 platform architecture. Retail behavior is expressed through Workspace Manifest configuration and registry accessors, with no platform-kernel changes.

ARC-004 is officially released following successful implementation, verification, and architecture audit. The Claude Code architecture audit concluded with an overall PASS, confirming the Retail Business OS is fully configuration-driven and introduces no engine forks, cloned pages, duplicated modules, or Operator concepts.

## Highlights

### Retail Workspace Manifest

- `RETAIL_WORKSPACE_CONFIG` expanded with `workspaceName`, business capabilities, and full profiles.
- 14 navigation items, all pointing at existing shared routes.
- 10 dashboard widgets.
- 5 Retail template definitions (content, landing, lead magnet, CRM follow-up, referral).
- CRM, content, funnel, landing, analytics, AI Coach, and AI COO profiles.
- Retail AI Coach and AI COO profiles (mission, directives, guardrails).

### Registry Integration

- New `WorkspaceRegistry` accessors: navigation items, dashboard widgets, templates, AI profile, AI COO profile, business capabilities.
- Retail metadata is exposed only through the Workspace Registry.

### Shared Platform Reuse

- Shared Content, CRM, Funnel, Landing, Analytics, AI Coach, and AI COO engines reused.
- AI COO routes to the shared `/ceo-mode` implementation.
- Existing Design System, Business Memory, and AI Brain reused.

## Compatibility

This release preserves:

- Platform Foundation and platform kernel (unchanged)
- Design System
- CAP-001 through CAP-008
- Recruitment workspace configuration
- Member-centric identity (no Operator introduced)
- Backward-compatible `WorkspaceConfig` (new fields optional)

## Validation

- Type Check: PASS (exit 0)
- Workspace Unit Tests: PASS (9 tests)
- Full Suite: 57 passed / 1 failed / 7 skipped (314 tests passed)
- Lint: PASS (existing warnings only)
- Build: PASS (existing warnings only)

Known limitation:

The single failing suite (`mission-engine.test.ts`) is blocked by a pre-existing local PostgreSQL dependency at `127.0.0.1:5432` and is not an ARC-004 regression.

## Audit Outcome

ARC-004 passed the Claude Code Architecture Audit with a PASS decision. Finding A — presentation-layer wiring is deferred (Retail manifest metadata is configured and registry-exposed but not yet rendered by UI surfaces). See [ARC-004 Audit Report](../audit/ARC_004_AUDIT_REPORT.md).

## Next Phase

**Retail Presentation-Layer Wiring** and **Recruitment Business OS Configuration**

Focus:

- Wire shared UI surfaces to consume Retail manifest metadata (navigation, widgets, templates, AI profiles).
- Configure the Recruitment Business OS using the same manifest-only pattern.
- Continue deferred Operator-to-Member RBAC migration and `businessMode` consolidation.

## Release Decision

**RELEASE APPROVED**

ARC-004 Retail Business OS Configuration is released on the NextShift OS 3.1 platform baseline.
