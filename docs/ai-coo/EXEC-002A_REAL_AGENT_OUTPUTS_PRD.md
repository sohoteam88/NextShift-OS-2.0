# EXEC-002A Real Agent Outputs PRD

Version: V8  
Status: P0 Critical  
Owner: AI Workforce System

## Depends On

- EXEC-002 Agent Assisted Execution
- EXEC-003 Autonomous Execution Guardrails
- COO-005 Mission Generator V2
- EXEC-001 Mission Execution Workspace

## Mission

Transform agents from recommendation producers into asset producers.

Current behavior: agent invocation creates a descriptor and audit record.

Target behavior: agent invocation creates a real draft asset that appears in Mission Workspace for user review and execution.

## Core Philosophy

An agent becomes valuable when it creates work, not when it describes work.

Every agent invocation should leave the user with something usable.

## Agent Output Hierarchy

| Level | Output |
| --- | --- |
| 1 | Descriptor |
| 2 | Draft Asset |
| 3 | Production Asset |

Target: all agents must reach Level 2, Draft Asset. Production deployment remains guarded by EXEC-003.

## Generated Asset Contract

```ts
interface GeneratedAsset {
  id: string;
  assetType: string;
  title: string;
  content: string;
  preview: string;
  status: 'DRAFT' | 'READY' | 'APPROVED' | 'ARCHIVED';
  sourceAgent: string;
  missionId: string;
  createdAt: string;
  updatedAt: string;
}
```

## Agent Outputs

- Content Agent generates `CONTENT_ASSET`: post drafts, captions, hooks, video scripts, content calendars.
- Lead Magnet Agent generates `LEAD_MAGNET_ASSET`: checklists, guides, PDF drafts, CTAs, follow-up messages.
- Funnel Agent generates `FUNNEL_ASSET`: landing page drafts, thank-you page drafts, CTA flows, lead flow structures.
- Offer Agent generates `OFFER_ASSET`: offer drafts, offer revisions, pricing suggestions, objection handling.
- CRM Agent generates `CRM_ASSET`: follow-up sequences, customer segmentation, retention workflows.
- Traffic Agent generates `TRAFFIC_ASSET`: traffic plans, audience profiles, ad angles, campaign structures.

## Workspace Integration

The Generated Assets panel displays:

- Asset name
- Asset type
- Status
- Preview
- Created by
- Created time

Workspace actions:

- Preview
- Mark Ready
- Approve
- Archive

Asset approval is not mission completion. Mission completion remains signal-based.

## Storage And Audit

Generated assets are stored through audit metadata with:

- Mission ID
- Agent ID
- Asset type
- Content
- Status
- Created At
- Updated At

Audit actions:

- `agent.asset.generated`
- `agent.asset.updated`
- `agent.asset.approved`
- `agent.asset.archived`

## Guardrail Integration

EXEC-003 guardrails apply before agent output generation.

Agents may generate assets and update draft assets. Agents may not publish assets, activate funnels, send campaigns, deploy assets, or mark missions complete.

Publishing remains approval-required.

## Acceptance Criteria

- Content Agent generates content.
- Lead Magnet Agent generates lead magnets.
- Funnel Agent generates funnel drafts.
- Offer Agent generates offers.
- CRM Agent generates CRM assets.
- Traffic Agent generates traffic plans.
- Generated assets appear in workspace.
- Preview exists.
- Approval exists.
- Audit logging exists.
- Guardrails remain active.
- Type-check passes.
- Build passes.

## Final Principle

Agents should create work, not describe work. The value of an agent is measured by the assets it produces.
