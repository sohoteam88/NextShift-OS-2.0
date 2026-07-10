# ARC-004 Retail Business OS Configuration

Version: 1.0  
Status: Released — Retail Business OS Configuration  
Architecture Track: NextShift OS 3.1  
Depends On: ARC-001, ARC-002, ARC-003
Implementation Task: ARC-004_CODEX_IMPLEMENTATION_TASK.md

## Purpose

ARC-004 begins the first Business Operating System built on the completed NextShift OS 3.1 platform architecture.

Unlike ARC-001 through ARC-003, this phase does **not** extend the platform kernel. Instead, it configures the Retail Business OS using shared engines, Workspace Manifest, Workspace Context, and the existing Design System.

## Objectives

- Configure the Retail Business Workspace.
- Reuse all shared engines.
- Reuse the existing Design System.
- Reuse Business Memory and AI Brain.
- Deliver a complete Retail Business Operating System without duplicating modules or pages.

## Retail Workspace Scope

The Retail Business OS should configure:

- Dashboard
- CRM
- Customer Journey
- Content Studio
- Offer Builder
- Funnel Builder
- Landing Pages
- Lead Magnet
- Analytics
- AI Coach
- AI COO
- Referral
- Repeat Purchase

All behavior must be configuration-driven.

Retail Business OS focuses on:

- Customer acquisition
- Customer success
- Retail sales
- Repeat purchase
- Referral
- Retention
- Customer pipeline
- Offer conversion

## Workspace Manifest

Create a Retail Workspace Manifest defining:

- Workspace name
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

No business logic may be hardcoded into engines.

## Engine Usage

Use only shared implementations:

- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- AI Coach
- AI COO

No Retail-specific engine classes are permitted.

## Deliverables

Codex must produce:

- Retail Workspace Manifest
- Retail Capability Configuration
- Retail Navigation Configuration
- Retail Dashboard Configuration
- Retail Prompt Configuration
- Retail AI Configuration
- Retail Content Templates
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

ARC-004 is complete when the Retail Business OS operates entirely through Workspace configuration while preserving the shared platform architecture.
