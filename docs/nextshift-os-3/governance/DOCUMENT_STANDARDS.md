# Document Standards

Version: 1.0

Status: Approved

## Purpose

This document defines the documentation standards for the NextShift OS repository.

Every architecture document, governance document, RFC, ADR, specification, and guideline must follow these standards.

The objective is consistency, readability, and long-term maintainability.

## General Rules

Every document should be written as a standalone reference.

A reader should understand the document without relying on hidden context.

Avoid duplicated definitions across documents.

Reference existing documents instead.

## Required Metadata

Every document should begin with:

- Title
- Version
- Status
- Last Updated, optional
- Owner, optional

Documents that are part of a release, implementation slice, capability, platform project, or governance chain should also follow [Traceability Standard](TRACEABILITY_STANDARD.md).

## Writing Style

Use:

- Clear and precise language
- Architecture terminology
- Business terminology
- Short paragraphs
- Consistent headings

Avoid:

- Marketing language
- Ambiguous wording
- Feature lists without architectural context
- Repeating definitions from other documents

## Document Structure

Whenever applicable, documents should include:

1. Purpose
2. Scope
3. Principles
4. Responsibilities
5. Rules
6. Relationships
7. Examples
8. Success Criteria

Not every document requires every section, but the structure should remain consistent.

## Naming Convention

Use uppercase filenames.

Examples:

- `FIRST_PRINCIPLES.md`
- `BUSINESS_TWIN_DEFINITION.md`
- `AI_REASONING_MODEL.md`
- `ARCHITECTURE_PRINCIPLES.md`
- `RFC_TEMPLATE.md`
- `ADR_TEMPLATE.md`

## Single Source of Truth

Every concept should have one authoritative definition.

If a concept already exists elsewhere, reference it instead of redefining it.

Document authority levels and conflict resolution are defined in [Document Hierarchy Standard](DOCUMENT_HIERARCHY_STANDARD.md).

## Versioning

Major architectural changes require a version increment.

Minor editorial improvements do not.

Document status should always be visible.

## Repository Principle

Documentation is part of the architecture.

Documentation should evolve together with the product.

Documentation is never an afterthought.

## Recommendation Artifacts

When ChatGPT or an AI contributor recommends a new governance document, roadmap, architecture document, implementation plan, engineering standard, product standard, or project planning artifact, the recommendation must also include a ready Markdown artifact.

Follow [Documentation Recommendation Standard](DOCUMENTATION_RECOMMENDATION_STANDARD.md) for the required output format and naming convention.
