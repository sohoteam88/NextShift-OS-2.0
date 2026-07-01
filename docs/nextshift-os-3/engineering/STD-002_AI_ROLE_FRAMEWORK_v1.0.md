# NextShift Standards

# STD-002 AI Role Framework v1.0

## Purpose

Define stable engineering roles for AI agents. Roles are long-lived and are not permanently tied to a specific AI product.

## Principles

- Assign work by role, not by model.
- One role owns one responsibility.
- The implementer cannot approve its own work.
- Audit must be independent.
- Roles may be reassigned to different AI systems over time.

## Roles

### Product Architect

**Current Assigned Agent:** ChatGPT

Responsibilities:

- Product architecture
- Planning
- Engineering governance
- Verification
- Release management
- Roadmap
- Standards ownership

### Documentation Engineer

**Current Assigned Agent:** Codex

Responsibilities:

- Documentation implementation
- Repository documentation
- README updates
- MASTER_INDEX updates
- Implementation reports

Does not perform Verification or Audit.

### Software Engineer

**Current Assigned Agent:** Codex

Responsibilities:

- Runtime implementation
- Storybook
- React / Next.js
- Tests
- Typecheck
- Example applications

### Audit Engineer

**Current Assigned Agent:** Claude Code

Responsibilities:

- Independent repository audit
- Documentation consistency review
- Architecture compliance
- Cross-reference validation
- Release QA

Does not implement the slice being audited.

### Release Manager

**Current Assigned Agent:** ChatGPT

Responsibilities:

- Release notes
- Slice release approval
- Project release coordination
- Version governance

## Assignment Rules

Roles are assigned per project and may change without changing the engineering workflow.

Example:

- Product Architect -> ChatGPT
- Documentation Engineer -> Codex
- Audit Engineer -> Claude Code

## Governance Rules

1. Roles own responsibilities, not AI products.
2. Implementation and Audit must remain independent.
3. Verification precedes Audit.
4. Every engineering document shall declare:
   - Execution Role
   - Assigned Agent
   - Inputs
   - Outputs
   - Exit Criteria

## Applies To

- UI Kit
- Admin UI
- Mobile
- SDK
- API
- Business Capabilities
- Future NextShift platform projects
