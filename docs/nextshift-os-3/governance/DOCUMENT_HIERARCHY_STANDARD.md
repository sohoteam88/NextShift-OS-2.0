# Document Hierarchy Standard

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define the official documentation hierarchy for NextShift OS so every document has a clear authority level and ownership.

---

## Documentation Hierarchy

```text
Product Vision
  -> Architecture
  -> MVP Alignment
  -> Governance Standards
  -> Platform Projects
  -> Capabilities
  -> Slices
  -> Implementation
  -> Verification
  -> Audit
  -> Release
```

---

## Authority Levels

## Level 1 - Product Authority

- Product Vision
- MVP Alignment

## Level 2 - Architecture Authority

- Blueprint
- Architecture
- Runtime
- ADR
- Architecture Decision Records

## Level 3 - Governance

- Engineering Standards
- Release Governance
- GitHub Alignment
- Product Governance
- Decision Framework

## Level 4 - Platform Projects

- Design System
- UI Kit
- Workspace Experience Framework

## Level 5 - Capabilities

- CAP documents
- Domain Models
- Contracts

## Level 6 - Delivery

- Planning
- Execution
- Verification
- Audit
- Release Notes

---

## Conflict Resolution

If two documents conflict:

1. Higher authority prevails.
2. Lower document must be updated.
3. Record the change in release documentation.

---

## Governance Rule

No implementation may contradict a higher-level document.

All new documents must declare:

- Parent document
- Authority level
- Related MVP phase
- Related platform or capability

---

## Success Criteria

Every engineering artifact can be traced upward to:

```text
Product Vision -> MVP Alignment -> Architecture -> Governance
```

---

## Applies With

- [Document Standards](DOCUMENT_STANDARDS.md)
- [Traceability Standard](TRACEABILITY_STANDARD.md)
- [Repository Structure Standard](REPOSITORY_STRUCTURE_STANDARD.md)
- [Architecture Decision Record Standard](../adr/ARCHITECTURE_DECISION_RECORD_STANDARD.md)
- [Product Governance Charter](PRODUCT_GOVERNANCE_CHARTER.md)
- [MVP 1.0 Alignment](../MVP_1_ALIGNMENT.md)
- [STD-004 Release Governance v1.0](../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)
