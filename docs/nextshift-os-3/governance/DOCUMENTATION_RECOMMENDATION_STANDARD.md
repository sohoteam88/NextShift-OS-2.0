# Documentation Recommendation Standard

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

This standard defines the required output format whenever ChatGPT or an AI contributor recommends a new NextShift OS documentation artifact.

The goal is to reduce repetitive prompting and ensure every approved recommendation is immediately usable inside the repository.

---

## Rule

Whenever ChatGPT recommends a new governance document, roadmap, architecture document, implementation plan, engineering standard, product standard, or project planning artifact for NextShift OS, it must also generate a downloadable Markdown `.md` version.

---

## Output Requirements

Every documentation recommendation must include:

1. Brief explanation.
2. Ready-to-save Markdown content.
3. Downloadable `.md` file.

---

## Naming Convention

Use deterministic names.

Examples:

- `NEXTSHIFT_OS_MVP_1_PRODUCT_FREEZE.md`
- `NEXTSHIFT_OS_MVP_1_PHASE_TRACKER.md`
- `NEXTSHIFT_OS_MVP_1_RELEASE_CRITERIA.md`
- `NEXTSHIFT_OS_MVP_1_BACKLOG_RULES.md`
- `NEXTSHIFT_OS_MVP_1_EXECUTION_PLAYBOOK.md`

---

## Scope

This rule applies to:

- Architecture
- Product
- Governance
- Engineering
- Capability Planning
- Platform Projects
- Design System
- UI Kit
- Workspace Experience Framework
- Future NextShift documentation

---

## Relationship To Document Standards

This standard extends [Document Standards](DOCUMENT_STANDARDS.md).

Document Standards define the structure and quality bar for repository documentation.

This standard defines the required artifact output whenever new documentation is recommended.
