# @nextshift/workspace-runtime

## Boundary With `@nextshift/runtime`

`@nextshift/workspace-runtime` is retained as a legacy workspace/session runtime package. It owns workspace session state, runtime task timelines, operator decision handling, business decision attachment, and the CRM lead qualification workflow.

`@nextshift/runtime` remains the canonical OS 3.3 Runtime Platform package for Runtime Capability Adapter work. New adapters and runtime metadata contracts must use `createRuntimeAdapter()` from `@nextshift/runtime`, not the workflow/session classes in this package.

This package should be treated as existing workflow-session functionality. It should not grow into a second runtime adapter platform without a dedicated architecture review.

## Current Status

- Source files: 1
- Test files: 1
- Tests: substantive workspace session and lead qualification workflow coverage
- Decision: retained because it contains real workspace workflow logic and active tests
