# ARC-005 Recruitment Business OS Configuration

Version: 1.0

Status: Released — Recruitment Business OS Configuration

Architecture Track: NextShift OS 3.1

Depends On: ARC-001, ARC-002, ARC-003, ARC-004

## Purpose

ARC-005 delivers the Recruitment Business Operating System using the completed NextShift OS 3.1 platform architecture.

Like ARC-004, this phase is configuration-driven. It must reuse the Platform Kernel, Workspace Context, Workspace Registry, shared engines, Design System, Business Memory, and AI Brain.

No platform redesign is permitted.

## Objectives

- Configure the Recruitment Workspace.
- Reuse all shared engines.
- Reuse the existing Design System.
- Reuse Business Memory and AI Brain.
- Deliver a complete Recruitment Business Operating System without duplicating modules, pages, or engines.

## Recruitment Workspace Scope

Configure:

- Personal Brand
- Authority Building
- Lead Generation
- Dashboard
- CRM
- Business Journey
- Recruitment Content Studio
- Opportunity Funnel
- Landing Pages
- Lead Magnets
- Webinar
- Analytics
- AI Coach
- AI COO
- Fast Start
- Team Building
- Duplication
- Leadership

All behavior must be configuration-driven.

## Workspace Manifest

Create a Recruitment Workspace Manifest containing:

- Navigation
- Dashboard widgets
- Theme
- Capabilities
- Prompt profile
- Content profile
- Funnel profile
- CRM profile
- Analytics profile
- AI Coach profile
- AI COO profile
- Template namespace

No engine logic may be hardcoded.

## Engine Usage

Use only shared implementations:

- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- AI Coach
- AI COO

Do not create Recruitment-specific engine classes.

## Deliverables

Codex must produce:

- Recruitment Workspace Manifest
- Recruitment Capability Configuration
- Recruitment Navigation Configuration
- Recruitment Dashboard Configuration
- Recruitment Prompt Configuration
- Recruitment AI Configuration
- Recruitment Content Templates
- Documentation updates

## Validation

Required:

- Type Check
- Lint
- Unit Tests
- Build
- No duplicated modules
- No duplicated pages
- No duplicated engines
- No Design System regression
- No CAP regression

## Exit Criteria

ARC-005 is complete when the Recruitment Business OS operates entirely through Workspace configuration while preserving the shared platform architecture.

After ARC-005, Retail and Recruitment Business Operating Systems should coexist on one platform through Workspace configuration only.
