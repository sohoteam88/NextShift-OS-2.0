# AI Model Router Checklist v2.0

## Pre-Routing

- [ ] Classify task type and output type.
- [ ] Determine execution platform: Claude Code / Codex / Coworker.
- [ ] Estimate complexity: Low / Medium / High / Critical.
- [ ] Estimate risk: Low / Medium / High / Critical.
- [ ] Estimate context size: Small / Medium / Large / Huge.
- [ ] Identify required reasoning: Basic / Advanced / Deep / Extended Thinking.
- [ ] Check cost sensitivity and speed priority.
- [ ] Check interactivity requirement (human-in-loop needed?).

## Routing Decision

- [ ] Calculate confidence score (High >85% / Medium 60-85% / Low <60%).
- [ ] If confidence < 60%, STOP and produce clarification questions.
- [ ] Apply escalation rules BEFORE downgrade rules.
- [ ] Check if task is decomposable into parallel subtasks.
- [ ] Select recommended tier and specific model.
- [ ] Read architecture files when task touches core system behavior.

## Output Validation

- [ ] Produce the full `MODEL ROUTING DECISION` output block.
- [ ] Include platform assignment.
- [ ] Include confidence score with percentage.
- [ ] Include decomposition plan if applicable.
- [ ] Include fallback tier with trigger condition.
- [ ] Include cost and latency estimates.

## Safety Rails

- [ ] Never route user data / security / permissions / auth / billing / multi-tenant to Tier B or C.
- [ ] Never execute without reading architecture files when task touches system design.
- [ ] Escalate one tier after two failed attempts (Auto-Escalation Protocol).
- [ ] If model output contradicts architecture files → STOP → re-read → re-route.
- [ ] If Codex task needs >3 human clarification rounds → reroute to Claude Code.
- [ ] If task scope unclear → produce assumption list, do not guess.
