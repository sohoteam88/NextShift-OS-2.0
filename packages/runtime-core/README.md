# @nextshift/runtime-core

## Boundary With `@nextshift/runtime`

`@nextshift/runtime-core` is retained as a legacy workflow/event kernel for the earlier runtime workflow stack. It provides lightweight workflow event types, execution context types, result types, and `createRuntimeEvent()` / `isRuntimeEvent()` helpers used by `@nextshift/event-bus`, `@nextshift/runtime-adapters`, `@nextshift/runtime-orchestrator`, and `@nextshift/workspace-runtime`.

`@nextshift/runtime` remains the canonical OS 3.3 Runtime Platform package for Runtime Capability Adapter work, including `createRuntimeAdapter()`, runtime contexts, runtime capabilities, runtime events, diagnostics, sessions, workspaces, and permissions.

New Runtime Capability Adapters must use `@nextshift/runtime` and must not use this package as a second adapter platform. This package should only be used for existing workflow/session runtime code until that stack is explicitly migrated or retired.

## Current Status

- Source files: 1
- Test files: 1
- Tests: substantive event creation and validation coverage
- Decision: retained because it has real dependents and active package tests
