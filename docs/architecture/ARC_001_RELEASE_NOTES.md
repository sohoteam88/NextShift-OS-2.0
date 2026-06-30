# ARC-001 Release Notes

Version: 1.0  
Status: Released

## Release

**ARC-001 -- Platform Kernel & Member-Centric Identity Foundation**

This release establishes the architectural baseline for NextShift OS 3.1 by introducing the Platform Kernel, Business Workspace Layer, and Member-Centric Identity Model while preserving backward compatibility.

## Highlights

### Platform Foundation

- Platform Kernel established.
- Business Workspace Layer introduced.
- Workspace Context foundation implemented.
- Workspace Resolver and Workspace Switcher added.

### Identity

- Member is the single authenticated identity.
- Workspace Membership introduced.
- Role and Permission aligned with Workspace Context.
- Operator deprecated for all future development.

### Shared Engine Strategy

The following remain shared implementations:

- AI Brain
- Business Memory
- Content Engine
- CRM Engine
- Funnel Engine
- Landing Engine
- Analytics Engine
- AI Coach
- AI COO

No duplicated engines were introduced.

## Compatibility

This release preserves:

- Platform Foundation
- Design System
- CAP-001 through CAP-008
- Existing public APIs and services
- Legacy Single Business Flow

## Validation

- Type Check: PASS
- Workspace Unit Tests: PASS
- Lint: PASS (existing warnings only)
- Build: PASS

Known limitation:

The full test suite is blocked by a pre-existing PostgreSQL dependency and is not an ARC-001 regression.

## Governance

ARC-001 is the governing architecture baseline for NextShift OS 3.1.

Future work shall follow:

- Member-Centric Identity
- Workspace-Centric Architecture
- Configuration-driven behavior
- One Engine, Multiple Workspace Configurations

## Next Phase

**ARC-002 -- Workspace Context Architecture**

Focus:

- Workspace Repository
- Workspace Registry
- Workspace Manifest
- Context Injection
- Engine Context Integration

## Release Decision

**Released**
