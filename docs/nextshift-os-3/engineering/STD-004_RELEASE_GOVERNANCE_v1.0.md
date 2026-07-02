# STD-004 Release Governance v1.0

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Standardize every NextShift release so architecture, implementation, documentation, GitHub, and audits remain synchronized.

This standard defines the official release governance model for every NextShift project, slice, capability, platform project, and architecture milestone.

---

## Scope

Applies to:

- UI Kit
- Design System
- Workspace Experience Framework
- Business Capabilities
- Platform Projects
- Architecture Milestones
- Admin UI
- SDK
- API
- Mobile
- Future platform projects

---

## Release Lifecycle

```text
Planning
  -> Implementation
  -> Verification
  -> Repository Audit
  -> GitHub Alignment
  -> Release
  -> Next Slice
```

No Slice, Capability, Platform Project, or Architecture milestone may be marked Released without completing this governance process.

---

## Release Levels

### Slice Release

Requirements:

- Planning approved
- Documentation implementation complete
- Requirements verification passed
- Repository audit passed
- GitHub alignment passed
- Release Notes generated
- Slice Release generated

Output:

- Slice status = Released

### Capability Release

Requirements:

- All required slices released
- Capability verification complete
- Capability audit complete
- Release package prepared
- Version assigned
- GitHub alignment passed

Output:

- Capability status = Released

### Project Release

Requirements:

- All required slices released
- Project verification complete
- Project audit complete
- Release package prepared
- Version assigned
- GitHub alignment passed

Output:

- Project status = Released

---

## Mandatory Release Package

Every release must contain:

- Planning
- Implementation Report
- Requirements Verification
- Audit Report
- Release Notes
- Slice Release, Capability Release, or Project Release
- Updated README, if applicable
- Updated MASTER_INDEX
- Updated PROJECT_ROADMAP, if applicable
- Updated CAPABILITY_STATUS, if applicable
- Updated MVP_1_PHASE_TRACKER, if applicable
- Traceability links validated
- Version tag, when release level requires it

---

## Release Gates

### Gate 1 - Engineering

- Tests pass
- Typecheck passes
- Build passes

### Gate 2 - Documentation

- Documents updated
- Links validated
- Version numbers consistent

### Gate 3 - Repository

- Working tree clean
- GitHub synchronized
- Tags verified

### Gate 4 - Product

- Aligns with MVP Phase 1, 2, or 3
- Improves the operating loop
- No architectural conflicts

---

## Versioning

Use Semantic Versioning:

- MAJOR: Breaking architectural change
- MINOR: New capabilities or standards
- PATCH: Corrections and documentation improvements

Examples:

- v1.0.0
- v1.1.0
- v2.0.0

---

## Approval Matrix

| Stage | Owner |
| --- | --- |
| Planning | Product Architect |
| Implementation | Documentation / Software Engineer |
| Verification | Product Architect |
| Repository Audit | Audit Engineer |
| GitHub Alignment | Release Manager |
| Release | Release Manager |
| Final Approval | Project Owner |

---

## Release Decision

Release is approved only when all gates pass.

If any gate fails:

1. Stop the release.
2. Resolve findings.
3. Repeat verification.

---

## Governance Rules

- No slice may be released without Verification and Audit.
- No capability may be released with unreleased required slices.
- No project may be released with unreleased required slices.
- No architecture milestone may be released without repository and GitHub alignment.
- Standards are referenced rather than duplicated.
- Repository indexes must be current before release.
- Release state must match GitHub state.

---

## Compliance Checklist

- Lifecycle complete
- Required documents exist
- Repository updated
- Version assigned
- Release notes published
- Audit passed
- Verification passed
- GitHub alignment passed
- MVP phase alignment confirmed

---

## Applies With

- STD-001 Engineering Workflow Standard
- STD-002 AI Role Framework
- STD-003 Documentation Standard
- STD-005 GitHub Alignment Standard
- NextShift Engineering Execution Playbook
- Product Governance Charter
- Product Decision Framework
- Change Management Standard
- Traceability Standard
- Repository Structure Standard
- Platform Project Standard
- Capability Lifecycle Standard
- Workspace Standard
- AI Workspace Standard
- Content Workspace Standard
- Visual Workspace Standard
- Video Workspace Standard
- Publishing Workspace Standard
- Content Intelligence Standard
- Learning System Standard
- Implementation Master Roadmap
- Architecture Decision Record Standard
- MVP 1.0 Alignment
- MVP 1.0 Implementation Master Plan
- MVP 1.0 Phase Tracker
- Product Backlog Standard
