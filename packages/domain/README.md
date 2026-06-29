# @nextshift/domain

Canonical domain model package for NextShift OS.

## Responsibilities

- Define shared domain entities.
- Define domain value objects.
- Preserve canonical business language.
- Provide pure domain types used by other packages.

## Non-responsibilities

- Does not implement business logic services.
- Does not access databases.
- Does not publish or subscribe to events.
- Does not implement AI reasoning.
- Does not depend on runtime packages.

## Architecture Rule

Domain defines the business language.

Runtime packages use the domain language.
