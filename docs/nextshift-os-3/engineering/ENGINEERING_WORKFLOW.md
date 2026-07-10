# NextShift OS 3.x Engineering Workflow

Version: 1.0  
Status: Active Standard

## Purpose

This document defines the official engineering lifecycle for all NextShift OS 3.x architecture, platform, capability, and design system development.

It standardizes responsibilities across ChatGPT, Codex, and Claude Code to ensure consistent implementation, verification, audit, and release governance.

## Engineering Lifecycle

```text
Architecture Blueprint
        |
        v
Implementation (Codex)
        |
        v
Implementation Report (ChatGPT)
        |
        v
Verification (Codex)
        |
        v
Verification Checklist (ChatGPT)
        |
        v
Architecture Audit (Claude Code)
        |
        v
Audit Report (ChatGPT)
        |
        v
Release Notes (ChatGPT)
        |
        v
GitHub Alignment (STD-005)
        |
        v
Released
```

## Responsibilities

### ChatGPT

Responsible for:

- Architecture Blueprint
- PRD
- Technical Specifications
- Implementation Report
- Verification Checklist
- Audit Report generated from Claude Code audit results
- Release Notes
- Roadmaps
- Architecture Decision Records

ChatGPT must not fabricate audit findings.

### Codex

Responsible for:

- Implementation
- Refactoring
- Documentation landing
- Type checking
- Unit tests
- Build validation
- Migration implementation
- Verification execution
- GitHub, release tag, and deployment revision verification when release alignment is in scope

Codex outputs:

- Implementation Summary
- Files Changed
- Commands Executed
- Validation Results
- Alignment Results, when release alignment is in scope

### Claude Code

Responsible for architecture governance only.

Audit scope includes:

- Architecture compliance
- Platform Foundation integrity
- Design System integrity
- ARC compliance
- CAP compliance
- No duplicated modules
- No duplicated pages
- No duplicated engines
- Backward compatibility
- Technical debt review
- Migration risk review
- Performance impact
- Test coverage review

Outputs:

- Findings
- Risks
- Recommendations
- PASS / FAIL decision

## Documentation Standards

Each ARC/CAP should produce:

1. Architecture Blueprint
2. Implementation Report
3. Verification Checklist
4. Audit Report
5. Release Notes

## Definition Of Done

Implementation is complete only when:

- Code implemented
- Type check passes
- Build passes
- Required tests pass
- Verification completed
- Claude Code audit passes
- Release Notes generated
- Documentation updated
- GitHub alignment passes when release alignment is required

## Architecture Principles

- Architecture First
- Configuration Before Customization
- Abstract Before Duplicate
- One Platform
- One AI Brain
- One Business Memory
- One Engine Layer
- Multiple Business Workspaces
- Member-Centric Identity

## Release Gate

Release requires:

- Implementation Complete
- Verification PASS
- Claude Code Audit PASS
- No critical regressions
- Documentation complete
- GitHub alignment PASS when release alignment is required

Release branch, tag, VPS deployed revision, and production traceability checks are governed by [STD-005 GitHub Alignment Standard v1.0](STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md).

## Continuous Improvement

This workflow is the governing engineering standard for all future ARC, CAP, Platform Foundation, and Design System work within NextShift OS 3.x.
