-- OS 3.8 additive hardening for the internal durable audit queues created by
-- 20260717135456_u3b_three_space_audit.sql. These tables are server-only and
-- deliberately expose no client-facing Data API policy.
ALTER TABLE public.audit_event_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_operational_alerts ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.audit_event_outbox FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.audit_operational_alerts FROM anon, authenticated;
