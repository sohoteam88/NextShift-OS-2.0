# Security Auditor Checklist

Before finishing a `security-auditor` task, check:

- [ ] Referenced `docs/architecture/17_SECURITY_ARCHITECTURE.md` for current security model
- [ ] Checked `docs/architecture/05_USER_ROLES_AND_PERMISSIONS.md` for role requirements
- [ ] Tenant isolation (RLS + tenant_id) verified or flagged
- [ ] Every issue classified by severity (Critical/High/Medium/Low)
- [ ] Fix recommendations include specific code or config changes
- [ ] No secrets, API keys, or tokens included in the output
- [ ] PDPA compliance status addressed if user data is involved
- [ ] Audit logging requirements specified for sensitive operations
- [ ] Output is actionable for Claude Code or Codex
