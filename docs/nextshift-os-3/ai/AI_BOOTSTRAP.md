# AI Bootstrap

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define the repository entry point for AI assistants working on NextShift OS.

This document tells an assistant what to load before planning, implementing, verifying, auditing, or releasing work.

---

## Required Reading Order

1. [AI Bootstrap Framework](README.md)
2. [Project Status](../PROJECT_STATUS.md)
3. [Master Index](../MASTER_INDEX.md)
4. [README](../README.md)
5. [MVP 1.0 Alignment](../MVP_1_ALIGNMENT.md)
6. [MVP 1.0 Implementation Master Plan](../MVP_1_IMPLEMENTATION_MASTER_PLAN.md)
7. [MVP 1.0 Phase Tracker](../MVP_1_PHASE_TRACKER.md)
8. [NextShift Standards v1.0](../standards/README.md)
9. [Engineering Standards v1.0 Release Package](../engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md)

Load deeper capability, workspace, architecture, or release documents only when the task scope requires them.

---

## Canonical Document Hierarchy

Use this authority order when documents appear to conflict:

1. Product and architecture foundation documents.
2. Governance and standards documents.
3. Project release packages and manifests.
4. Capability, platform, workspace, and slice documents.
5. Implementation reports, verification reports, audits, and release notes.
6. Local conversation context.

Document hierarchy and conflict handling are governed by [Document Hierarchy Standard](../governance/DOCUMENT_HIERARCHY_STANDARD.md).

---

## Engineering Baseline

All AI execution must align with:

- [STD-001 Engineering Workflow](../engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md)
- [STD-002 AI Role Framework](../engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md)
- [STD-003 Documentation Standard](../engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md)
- [STD-004 Release Governance](../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)
- [STD-005 GitHub Alignment Standard](../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)
- [STD-006 Project Execution Orchestration Standard](../engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md)

---

## Release Baseline

Before release-related work, load:

- [STD-004 Release Governance](../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)
- [STD-005 GitHub Alignment Standard](../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)
- [Engineering Standards v1.0 Release Package](../engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md)

Release work must not move tags, modify release branches, or touch production unless the task explicitly authorizes that action and the required alignment checks pass.

---

## Bootstrap Checklist

- Confirm repository path and branch.
- Confirm working tree status.
- Identify the project, capability, slice, or release package in scope.
- Load the canonical documents listed above.
- Identify current project state using [AI Context Loading](AI_CONTEXT_LOADING.md).
- Follow the role and handoff rules in [AI Execution Guide](AI_EXECUTION_GUIDE.md).
