# AI Model Router Checklist

- Classify task type.
- Estimate complexity: Low / Medium / High / Critical.
- Estimate risk: Low / Medium / High / Critical.
- Estimate context size: Small / Medium / Large / Huge.
- Identify required reasoning: Basic / Advanced / Deep.
- Identify output type: Code / Architecture / Copy / UX / Data / Security.
- Check cost sensitivity and speed priority.
- Apply escalation rules before downgrade rules.
- Read architecture files when the task touches core system behavior.
- Produce the required `MODEL ROUTING DECISION` output.
- Escalate one tier after two failed low-tier attempts.
- Never route user data, security, permissions, auth, billing, or multi-tenant work to low-tier models.
