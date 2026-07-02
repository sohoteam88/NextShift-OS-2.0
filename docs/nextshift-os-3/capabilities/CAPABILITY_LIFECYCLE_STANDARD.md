# Capability Lifecycle Standard

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define the mandatory lifecycle for every NextShift Business Capability from idea through long-term maintenance.

---

## Capability Lifecycle

```text
Idea
  -> Capability Planning
  -> Slice Planning
  -> Implementation
  -> Verification
  -> Capability Audit
  -> GitHub Alignment
  -> Capability Release
  -> Reference / Maintenance
```

---

## Mandatory Capability Structure

Every capability must contain:

- Capability Definition
- Domain Model
- Application Specification
- Event Definitions
- Slice Roadmap
- Verification
- Audit
- Release Package

---

## Slice Structure

Each slice must include:

- Planning
- Documentation / Implementation Contract
- Execution Prompt
- Implementation Report
- Requirements Verification
- Audit Report
- Release Notes
- Slice Release

---

## Completion Gates

A capability is complete only when:

- All slices are released
- Verification passes
- Audit passes
- GitHub Alignment passes
- MVP Phase Tracker updated
- Documentation synchronized

---

## Maintenance

Released capabilities remain under maintenance.

Changes require:

- Change assessment
- Architecture review, if applicable
- Updated documentation
- Verification
- Audit
- New release notes

---

## Governance Rule

Capabilities create business value and must consume platform projects rather than redefining platform responsibilities.

---

## Applies With

- [Capabilities](README.md)
- [Capability Status](../CAPABILITY_STATUS.md)
- [Platform Project Standard](../governance/PLATFORM_PROJECT_STANDARD.md)
- [Change Management Standard](../governance/CHANGE_MANAGEMENT_STANDARD.md)
- [STD-004 Release Governance v1.0](../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)
