# CRM Database Examples

## Example 1: Add Referral Tracking Tables

**Input:** "Add referral tracking to the CRM database. Customers can refer friends via unique links."

**Expected output:**

```sql
-- New tables
CREATE TABLE referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  referrer_user_id TEXT NOT NULL REFERENCES users(id),
  referred_email TEXT NOT NULL,
  referred_user_id TEXT REFERENCES users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed_up, converted, rewarded
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
```

Prisma model, RLS policy, migration notes included. Architecture update flag: `07_DATABASE_ARCHITECTURE.md`.

## Example 2: Lead Scoring Fields

**Input:** "What fields do I need to support the AI lead scoring model?"

**Expected output:** Add to leads table: `score INT DEFAULT 0`, `score_updated_at TIMESTAMPTZ`, `score_reasons JSONB`. Index on `(tenant_id, score DESC)` for "hottest leads" query. No schema change needed for scoring signals — they're computed from existing activity/tag/note data.

## When NOT to Use This Skill

- User needs **scoring logic** → use `ai/ai-lead-scoring`
- User needs **CRM workflow design** → use `crm/crm-architect`
