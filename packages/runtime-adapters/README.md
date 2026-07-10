# @nextshift/runtime-adapters

## Boundary With `@nextshift/runtime`

`@nextshift/runtime-adapters` is retained as a legacy workflow adapter package for repository health, business decisions, and CRM lead qualification flows. It defines workflow-facing adapter interfaces and in-memory implementations used by `@nextshift/runtime-orchestrator` and `@nextshift/workspace-runtime`.

`@nextshift/runtime` remains the canonical OS 3.3 Runtime Platform package for Runtime Capability Adapter work. New module adapters must use `createRuntimeAdapter()` from `@nextshift/runtime` and must follow `docs/nextshift-os-3/runtime-standard/RUNTIME_ADAPTER_STANDARD.md`.

This package must not be treated as the standard home for new Runtime Capability Adapters. It is a retained compatibility package for existing workflow tests and earlier runtime workflow experiments.

## Current Status

- Source files: 4
- Test files: 1
- Tests: substantive repository, business decision, and CRM adapter assertions
- Decision: retained because it has real workflow adapter logic and is depended on by runtime orchestrator and workspace runtime packages
