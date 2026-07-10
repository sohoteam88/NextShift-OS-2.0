# AI Session Starter

Version: 1.0

Status: Approved

Last Updated: 2026-07-03

---

## Purpose

Provide a reusable session-start template for AI assistants working on NextShift OS.

This template loads context and waits for the operator's task. It does not contain project status; the current state remains owned by [Project Status](../../PROJECT_STATUS.md).

---

## Session Start Template

```text
Start a NextShift OS session.

Bootstrap order:
1. Read docs/nextshift-os-3/ai/AI_BOOTSTRAP.md.
2. Read docs/nextshift-os-3/ai/NEXTSHIFT_CONTEXT.md.
3. Read docs/nextshift-os-3/PROJECT_STATUS.md.
4. Read docs/nextshift-os-3/MASTER_INDEX.md.
5. Load only the standards required for the requested task.

Context loading order:
1. Confirm active branch and working tree status.
2. Identify the project, capability, platform, workspace, slice, or release package in scope.
3. Locate the latest planning, implementation, verification, audit, and release artifacts for that scope.
4. Continue from the current phase and next missing artifact.
5. Do not restart completed lifecycle phases unless revision is explicitly requested.

Stop point reminder:
- Stop A: after Planning, Documentation Implementation Contract, and Execution Task.
- Stop B: after Implementation evidence, Requirements Verification, and Repository Audit Contract.
- Stop C: after Audit evidence, Release Decision, Release Notes, and Next Slice or Phase Planning.

Continue-from-current-phase rule:
Use repository artifacts to identify the latest completed phase. Continue from that point only.

Wait for user instruction before implementation, release branch work, tag movement, or production action.
```

---

## References

- [AI Bootstrap](AI_BOOTSTRAP.md)
- [NextShift Context](../NEXTSHIFT_CONTEXT.md)
- [AI Context Loading](AI_CONTEXT_LOADING.md)
- [AI Execution Guide](AI_EXECUTION_GUIDE.md)
- [Project Status](../../PROJECT_STATUS.md)
- [STD-006 Project Execution Orchestration Standard](../../engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md)
