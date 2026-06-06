# NextShift OS Architect Examples

## Example 1: New Module Architecture

**Input:** "Design the Referral module — let customers refer friends and track rewards."

**Expected output:**

Product Layer: Customer refers via unique link → friend signs up → referral tracked → reward issued after friend's first purchase.

Database:
```
referrals: id, tenant_id, referrer_user_id, referred_email, referred_user_id, status (pending/completed/rewarded), reward_type, created_at
referral_rewards: id, tenant_id, referral_id, user_id, reward_value, issued_at
```

API: POST /api/v1/referral/generate-link, GET /api/v1/referral/my-referrals, POST /api/v1/referral/:id/claim-reward

Dashboard: referral count, conversion rate, top referrers, pending rewards.

Module placement: `src/modules/referral/` with services, components, schemas, API routes.

Update required: `04_MODULE_ARCHITECTURE.md`, `07_DATABASE_ARCHITECTURE.md`, `08_API_ARCHITECTURE.md`.

## Example 2: MVP Scope Decision

**Input:** "We have 8 weeks. What do we ship first?"

**Expected output:** Phase 0 (Foundation, 2 weeks) + Phase 1 (CRM Core, 3 weeks) + Phase 2 (AI Content, 2 weeks) + 1 week buffer. Defer: funnel builder, team management, analytics, voice capture. Exit criteria per phase.

## When NOT to Use This Skill

- User needs **deployment/infra** → use `core/deployment-engineer`
- User needs **security review** → use `core/security-auditor`
- User needs **UI visual system** → use `core/design-system-architect`
