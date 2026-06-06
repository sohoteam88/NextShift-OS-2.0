# AI Agent Orchestrator Checklist

- [ ] Each agent has defined role, input, output, tools, and boundaries
- [ ] Orchestration flow is explicit (sequence, parallel, conditional)
- [ ] Human review points defined for high-impact actions
- [ ] Guardrails specified (what agents cannot do)
- [ ] Fallback states defined (what happens on failure)
- [ ] Retry limits set (max 3 per agent)
- [ ] All steps logged for observability
- [ ] Tool permissions scoped per agent
- [ ] Memory/context passing between agents specified
- [ ] No API keys or secrets exposed to agents
