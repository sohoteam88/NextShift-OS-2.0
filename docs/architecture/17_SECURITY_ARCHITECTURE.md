# 17 — Security Architecture

> Authentication, authorization, data protection, and compliance for NextShift OS.

---

## 1. Purpose

Define the security model that protects user data, enforces tenant isolation, secures API access, and meets Malaysian regulatory requirements (PDPA 2010).

## 2. Scope

- Authentication (login, sessions, MFA)
- Authorization (RBAC, RLS)
- Data encryption (at rest, in transit)
- API security
- Input validation
- Secrets management
- Audit logging
- PDPA compliance
- Incident response basics

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Supabase Auth | Built-in with DB, supports email/password + OAuth |
| Session strategy | JWT (short-lived) + refresh token | Stateless API calls; refresh for long sessions |
| Authorization | RBAC + Supabase RLS | App-level role checks + DB-level tenant isolation |
| Encryption at rest | Supabase managed (AES-256) | Default for Supabase-hosted PostgreSQL |
| Encryption in transit | TLS 1.2+ everywhere | Nginx terminates SSL; internal services over private network |
| Secrets management | Environment variables + Docker secrets | Simple for VPS deployment; no cloud KMS needed at current scale |
| Password policy | Min 8 chars, no complexity rules | NIST 800-63B recommendation; complexity rules reduce security |

---

## 4. Authentication

### 4.1 Login Flow

```
User enters email + password
        │
        ▼
Supabase Auth verifies credentials
        │
        ▼
Returns: access_token (JWT, 1h expiry)
       + refresh_token (30d expiry)
        │
        ▼
Client stores in httpOnly cookies
        │
        ▼
Every API request: Authorization: Bearer {access_token}
        │
        ▼
Middleware: verify JWT → extract user_id, tenant_id, role
```

### 4.2 JWT Claims

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "member",
  "tenant_id": "tenant_cuid",
  "iat": 1700000000,
  "exp": 1700003600
}
```

### 4.3 Session Security

- Access token: 1 hour expiry
- Refresh token: 30 days, rotated on each use
- Cookies: `httpOnly`, `Secure`, `SameSite=Lax`
- Logout: revoke refresh token server-side

### 4.4 Future: MFA

Phase 2 — TOTP (Google Authenticator) for operator and leader roles.

---

## 5. Authorization

### 5.1 RBAC Middleware Stack

```
Request
  → verifyJWT()           // Is the token valid?
  → extractTenant()       // Set tenant context
  → checkRole(required)   // Does user have the required role?
  → RLS policy            // DB enforces tenant_id filter
  → Handler
```

See `05_USER_ROLES_AND_PERMISSIONS.md` for the full permission matrix.

### 5.2 Row Level Security (RLS)

Every tenant-scoped table has:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.current_tenant_id')::text);
```

Application sets `app.current_tenant_id` at the start of each request via:

```sql
SET LOCAL app.current_tenant_id = '{tenant_id}';
```

### 5.3 Resource-Level Authorization

Beyond role checks, some resources require ownership checks:

- Member can only see their own leads (`leads.user_id = current_user_id`)
- Leader can see their downline's leads (sponsor tree traversal)
- Operator can see all tenant leads

---

## 6. API Security

### 6.1 Rate Limiting

| Endpoint group | Limit | Window |
|----------------|-------|--------|
| Auth (login, register) | 10 req | 15 min per IP |
| AI generation | 20 req | 1 hour per user |
| General API | 100 req | 1 min per user |
| Public funnel pages | 60 req | 1 min per IP |
| Webhook receivers | 30 req | 1 min per source |

Implementation: in-memory rate limiter (e.g. `rate-limiter-flexible` with Redis or memory store).

### 6.2 Input Validation

- All request bodies validated with Zod schemas before processing
- SQL injection: prevented by Prisma parameterized queries (never raw SQL with user input)
- XSS: React auto-escapes; `dangerouslySetInnerHTML` prohibited except in funnel renderer (sanitized with DOMPurify)
- CSRF: SameSite cookies + origin check on mutating requests
- File upload: validate MIME type, file size, and extension server-side

### 6.3 CORS

```ts
{
  origin: [
    'https://app.nextshift.my',
    'https://*.nextshift.my',  // tenant subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}
```

### 6.4 Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
Permissions-Policy: camera=(), microphone=(self), geolocation=()
```

Note: `microphone=(self)` required for voice capture feature.

---

## 7. Data Protection

### 7.1 Sensitive Data Classification

| Category | Examples | Protection |
|----------|----------|------------|
| Credentials | Passwords, API keys | Hashed (bcrypt) / encrypted env vars; never logged |
| PII | Name, email, phone, IC number | Encrypted at rest; access-logged; deletable on request |
| Health data | Pain points, health goals, voice recordings | Tenant-isolated; user-deletable; not shared cross-tenant |
| Business data | Leads, pipeline, funnels | Tenant-isolated via RLS |
| System data | Logs, metrics | No PII in logs; rotate after 90 days |

### 7.2 Data Retention

| Data type | Retention | Deletion |
|-----------|-----------|----------|
| User accounts | Until deletion requested | Soft-delete → hard-delete after 30 days |
| Voice recordings | Until user deletes | User can delete anytime; operator can set auto-delete after extraction |
| Activity logs | 1 year | Auto-purge |
| AI usage logs | 6 months | Auto-purge |
| Backups | 30 days rolling | Auto-rotate |

---

## 8. PDPA 2010 Compliance (Malaysia)

| Requirement | Implementation |
|-------------|----------------|
| Consent | Registration form includes consent checkbox with link to privacy policy |
| Purpose limitation | Privacy policy states: data used for CRM, coaching, content generation |
| Data access request | User can export all their data via Settings → Export My Data |
| Data deletion request | User can request account deletion; completed within 30 days |
| Data portability | Export as JSON/CSV |
| Cross-border transfer | Supabase region: Singapore (closest to Malaysia); document in privacy policy |
| Data protection officer | Operator is DPO for their tenant; Steven is platform-level DPO |

---

## 9. Audit Logging

### 9.1 What is Logged

| Event | Fields |
|-------|--------|
| Login success/failure | user_id, IP, timestamp, user_agent |
| Role change | who changed, target user, old role → new role |
| Lead data export | user_id, count, timestamp |
| AI prompt template edit | user_id, template_id, diff |
| Member approval/rejection | approver, target user |
| Data deletion | user_id, what was deleted |

### 9.2 Log Storage

Audit logs stored in `audit_logs` table (not in application logs):

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  tenant_id  String
  user_id    String?
  action     String   // e.g. "login", "lead.export", "role.change"
  target     String?  // e.g. "user:cuid123"
  metadata   Json?    // additional context
  ip_address String?
  created_at DateTime @default(now())

  @@index([tenant_id, action])
  @@index([tenant_id, created_at])
}
```

---

## 10. Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| Supabase service key | `.env` → Docker secret | On compromise |
| OpenAI API key | `.env` → Docker secret | Quarterly |
| Anthropic API key | `.env` → Docker secret | Quarterly |
| WhatsApp API token | `.env` → Docker secret | Per Meta policy |
| SMTP credentials | `.env` → Docker secret | Annual |
| JWT secret | Supabase managed | Supabase handles |

Production `.env` is **never committed to git**. `.env.example` contains keys without values.

---

## 11. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| JWT stolen from cookie | httpOnly + Secure + short expiry + refresh rotation |
| RLS misconfiguration exposes cross-tenant data | Integration tests that attempt cross-tenant access; fail = block deploy |
| Supabase service key leak | Restrict to server-side only; never expose to client bundle |
| Voice recordings contain sensitive health info | User controls deletion; encrypted storage; access-logged |
| DDoS on public funnel pages | Cloudflare or Nginx rate limiting; static asset caching |

---

## 12. Future Expansion

- MFA (TOTP) for operator and leader roles
- SSO (SAML/OIDC) for enterprise tenants
- Field-level encryption for IC numbers and phone numbers
- Automated penetration testing in CI pipeline
- SOC 2 Type II compliance (if entering enterprise market)

---

**Cross-references:** `05_USER_ROLES_AND_PERMISSIONS.md` (RBAC), `06_MULTI_TENANT_ARCHITECTURE.md` (RLS + tenant isolation), `07_DATABASE_ARCHITECTURE.md` (AuditLog model)
