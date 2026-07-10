# Workspace Experience Framework (WEF) v1.0

# WEF-005 Switching Model

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-005 Workspace Switching  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the canonical Workspace Switching model for moving between NextShift Business OS Workspaces.

## Definition

Workspace Switching is the controlled transition from one active Workspace context to another available Workspace context.

Switching is not simple navigation. It changes the active operating context, which affects Shell identity, Navigation entries, available capabilities, permissions, preferences, and surface state.

## Switching Responsibilities

Workspace Switching is responsible for:

- Identifying the current active Workspace
- Presenting available target Workspaces
- Confirming or safely initiating a context change
- Clearing or preserving eligible state
- Resolving target Workspace Context
- Updating Shell and Navigation orientation
- Preventing cross-Workspace action leakage
- Recovering safely when switching fails

## Switching Non-Responsibilities

Workspace Switching does not:

- Grant permissions
- Own authentication
- Own capability domain workflows
- Define runtime route implementation
- Define database schema
- Redesign the Workspace Shell
- Redesign Workspace Navigation
- Create Business OS-specific switching flows

## Switching Inputs

Switching consumes:

- Active Workspace Context
- Available Workspace list
- Member role and permissions
- Target Workspace state
- Target Workspace capability set
- Unsaved work state
- Persisted preferences when valid

## Canonical Rule

Only one Workspace may be active at a time. Switching must make the transition explicit, safe, and recoverable.
