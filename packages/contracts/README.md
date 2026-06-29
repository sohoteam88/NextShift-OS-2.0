# @nextshift/contracts

Implementation-independent contracts for NextShift OS.

This package defines architectural contracts shared across the platform.

## Rules

- Contracts define obligations, not implementation.
- Contracts may depend on @nextshift/shared.
- Contracts must not depend on Business Brain, Decision Brain, Execution Layer, Learning System, UI, database, or apps.
- Do not implement business logic here.
- Do not access infrastructure here.

## Current Contract Areas

- Business Twin
- Business Brain
- Decision Brain
- Execution Layer
- Learning System
- Events
