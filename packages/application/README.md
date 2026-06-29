# @nextshift/application

Application layer package for NextShift OS.

## Responsibilities

- Define application-level commands and queries.
- Define use-case boundaries.
- Define orchestration boundaries.
- Coordinate core packages through explicit application workflows.

## Non-responsibilities

- Does not own business truth.
- Does not own domain language.
- Does not own AI reasoning.
- Does not implement execution capabilities.
- Does not access databases directly.
- Does not implement API or UI.
- Does not implement agents.

## Architecture Rule

Domain defines business language.

Brains reason over business context.

Execution performs approved actions.

Learning improves future intelligence.

Application coordinates use cases without owning core intelligence.
