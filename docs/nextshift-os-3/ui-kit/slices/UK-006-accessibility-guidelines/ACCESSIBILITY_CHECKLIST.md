# NextShift UI Kit v1.0

# UK-006 Accessibility Checklist

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-001 through UK-005, NextShift Design System v1.0  
**Outputs:** Accessibility review checklist for Workspace-aware design documentation  
**Exit Criteria:** Checklist supports human QA and AI-assisted review without implementation details

## Purpose

This checklist helps designers, documentation engineers, QA reviewers, and AI Design Agents evaluate whether NextShift UI Kit artifacts include accessibility expectations.

This is a documentation checklist, not an automated test suite.

## Workspace Context

- [ ] Active Workspace identity is visible or otherwise available.
- [ ] Current view purpose is clear.
- [ ] Current object, module, dashboard, or flow context is clear.
- [ ] Workspace switching and navigation remain distinct.
- [ ] Compact layouts preserve Workspace context.

## Language and Labels

- [ ] Actions use outcome-based labels.
- [ ] Icon-only controls have an accessible name expectation.
- [ ] Status labels use consistent terminology.
- [ ] Error and recovery text is plain-language.
- [ ] Instructions appear near the affected field, action, or region.

## Keyboard and Focus

- [ ] Primary action is keyboard reachable.
- [ ] Secondary and recovery actions are keyboard reachable.
- [ ] Focus state is visible.
- [ ] Focus order follows task hierarchy.
- [ ] Modal, panel, menu, and disclosure contexts have an escape or close path.
- [ ] No critical control depends on hover only.

## Screen Reader and Semantics

- [ ] Reading order follows Workspace context, decision, action, feedback, and supporting detail.
- [ ] Interactive controls expose purpose.
- [ ] Repeated actions include enough object context.
- [ ] Selected, expanded, disabled, loading, error, success, and blocked states are documented.
- [ ] Tables, lists, KPI Cards, Widgets, and charts have textual meaning expectations.

## State and Feedback

- [ ] Loading state preserves context.
- [ ] Empty state explains absence and provides next action where available.
- [ ] Error state identifies the affected object or region.
- [ ] Error state includes recovery.
- [ ] Disabled state explains unavailable action when needed.
- [ ] Success state confirms material outcomes.
- [ ] Feedback is placed near the affected field, component, section, or Workspace region.

## Visual Accessibility

- [ ] State is not communicated by color alone.
- [ ] Tone, risk, validation, and confidence include text, icon, shape, or structure.
- [ ] Contrast intent is preserved without defining token values.
- [ ] Motion is not the only cue for change.
- [ ] Reduced-motion expectations are respected at the pattern level.
- [ ] Text and controls remain legible in compact layouts.

## Component Usage

- [ ] Existing Design System components are referenced.
- [ ] No new component primitive is invented.
- [ ] Component states reuse UK-003 vocabulary.
- [ ] Destructive actions include confirmation and recovery guidance.
- [ ] Interactive containers are not nested inside interactive containers.
- [ ] AI components include recommendation, reason, confidence or uncertainty, and member actions.

## Responsive Accessibility

- [ ] Reflow preserves hierarchy.
- [ ] Primary action remains reachable.
- [ ] Required feedback remains visible or discoverable.
- [ ] Navigation remains reachable.
- [ ] Labels remain attached to controls and fields.
- [ ] Compact views do not become icon-only without accessible labels.

## AI-Assisted Design Review

- [ ] Prompt states the accessibility scope.
- [ ] Prompt states keyboard expectation.
- [ ] Prompt states screen reader expectation.
- [ ] Prompt states color-independent communication.
- [ ] Prompt states feedback and recovery expectations.
- [ ] Prompt explicitly prevents Design System redesign.

## Sign-Off

UK-006 accessibility review is complete when all applicable checklist items are addressed or documented as not applicable with rationale.

## Status

Implemented.
