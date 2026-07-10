# UK-001 Documentation Language

## Purpose

This document defines how future UI Kit documents should be structured and written.

The goal is consistency across human-authored documentation, Claude Design prompts, QA references, and future AI-assisted design workflows.

## Required Document Structure

Every UI Kit document should include:

1. Purpose
2. Scope
3. Design Principles
4. Usage Guidance
5. Examples
6. Anti-patterns
7. Relationships
8. References
9. Version History

## Heading Hierarchy

Use predictable heading levels:

- `#` for document title only.
- `##` for major sections.
- `###` for subsections.
- `####` only when a section needs deeper decomposition.

Do not skip heading levels.

## Naming Conventions

Document titles should follow:

`UK-### Topic Name`

Examples:

- `UK-001 Design Language`
- `UK-003 Component Catalog`
- `UK-005 Interaction Patterns`

Pattern titles should use noun phrases:

- `Dashboard Summary Pattern`
- `Empty State Pattern`
- `Primary Action Pattern`

Action guidance should use verb phrases:

- `Create a customer`
- `Convert a lead`
- `Review risk`

## Terminology Rules

- Use approved terms from `TERMINOLOGY_GLOSSARY.md`.
- Prefer specific terms over generic labels.
- Do not use multiple names for the same concept.
- Introduce new terms only when they represent a new reusable concept.
- Define every new term before using it broadly.

## Cross-Reference Style

Use explicit relationship language:

- `Implementation authority: NextShift Design System v1.0`
- `Language authority: NextShift UI Kit v1.0`
- `Workflow authority: relevant Business Capability document`

Do not copy implementation details into UI Kit documents. Link or reference the owning artifact.

## Versioning Format

Use semantic project versioning:

`NextShift UI Kit v1.0`

Use slice identifiers for document lifecycle:

`UK-001 Design Language`

Use release labels:

- Planning
- Implemented
- Verified
- Audited
- Released

## Example Formatting

Examples should use this structure:

```text
Context:
What situation the example applies to.

Use:
The recommended design language or pattern.

Avoid:
The anti-pattern or ambiguous wording.
```

## Anti-Pattern Documentation

Every anti-pattern should include:

- Problem
- Why it creates risk
- Preferred replacement

Example:

```text
Problem:
Using "Manage" as a primary button label.

Why it creates risk:
It does not tell the user what will happen.

Preferred replacement:
Use a specific action such as "Create customer" or "Schedule follow-up".
```

## AI-Ready Writing Rules

- Write in direct statements.
- Avoid ambiguous adjectives.
- Use stable names for patterns and surfaces.
- Keep examples structurally consistent.
- State constraints explicitly.
- State non-goals explicitly.
- Prefer lists and tables when relationships matter.

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| v1.0 | Implemented | Initial documentation language standard for UK-001. |
