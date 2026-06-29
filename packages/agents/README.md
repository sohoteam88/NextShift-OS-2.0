# @nextshift/agents

Agent platform bootstrap package for NextShift OS.

## Responsibilities

- Define agent runtime boundaries.
- Define agent registry boundaries.
- Define agent task boundaries.
- Define agent handoff boundaries.
- Define agent policy boundaries.

## Non-responsibilities

- Does not own business truth.
- Does not own Business Memory.
- Does not directly access Story Vault.
- Does not directly access Knowledge Graph.
- Does not execute workflows directly.
- Does not implement autonomous execution.
- Does not implement real agent reasoning yet.
- Does not access database, API, UI, apps, or infrastructure.

## Architecture Rule

Agents are specialists.

The Business Brain owns business understanding.

The Decision Brain owns judgment.

The Execution Layer owns execution.

The Learning System owns learning.

Agents coordinate through the approved operating loop.
