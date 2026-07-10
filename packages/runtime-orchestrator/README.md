# @nextshift/runtime-orchestrator

## Boundary With `@nextshift/runtime`

`@nextshift/runtime-orchestrator` is retained as a legacy workflow orchestration package. It owns the earlier `RuntimeOrchestrator` workflow runner, approval gate behavior, repository health workflow, simulation validation, and audit trail abstractions.

`@nextshift/runtime` remains the canonical OS 3.3 Runtime Platform package for Runtime Capability Adapter work. New runtime integrations should not bypass `@nextshift/runtime` or `createRuntimeAdapter()` by adding new module adapters here.

This package may continue to support existing workflow orchestration experiments and tests. Any future migration into the canonical Runtime Platform must be planned explicitly instead of treating this package as a parallel runtime stack.

## Current Status

- Source files: 1
- Test files: 1
- Tests: substantive workflow execution, approval gate, failure event, and repository health workflow coverage
- Decision: retained because it contains real orchestration logic and active tests
