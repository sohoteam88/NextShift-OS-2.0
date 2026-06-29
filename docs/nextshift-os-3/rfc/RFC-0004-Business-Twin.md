# RFC-0004 - Business Twin

Status: Approved

Current document: [0.4 Business Twin Definition](../phase-0-foundation/0.4_BUSINESS_TWIN_DEFINITION.md)

## Summary

Define the Business Twin as the central intelligence object of NextShift OS 3.0.

## Decision

The Business Twin is the single source of business understanding. It is a living AI representation of the business, not a CRM, database table, dashboard, or document repository.

## Constitution Impact

This RFC makes the Business Twin the foundation for recommendations, memory, agents, execution, reflection, and learning.

## Approval Criteria

- Every recommendation references the Business Twin.
- Every execution updates the Business Twin.
- Every Agent reads from and writes to the Business Twin.
- No feature maintains independent business truth.
