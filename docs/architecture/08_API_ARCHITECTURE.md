# 08 — API Architecture

## Purpose

Define all API endpoints, authentication, error handling, and request/response conventions.

## Scope

REST API layer. For database, see `07_DATABASE_ARCHITECTURE.md`. For auth, see `17_SECURITY_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | REST with JSON | Simple, well-understood, sufficient for this app |
| Framework | Next.js API Routes (App Router) | Co-located with frontend, serverless-compatible |
| Auth | Bearer token (Supabase JWT) | Standard, works with RLS |
| Versioning | URL prefix `/api/v1/` | Future-proof for breaking changes |
| Rate limiting | Per-tenant, per-user, per-endpoint | Prevent abuse, enforce plan limits |

## Endpoint Map

### Auth — `/api/v1/auth/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/login` | Public | Email + password login |
| POST | `/register` | Public | New member registration (pending approval) |
| POST | `/logout` | Any | End session |
| POST | `/forgot-password` | Public | Send reset email |
| POST | `/reset-password` | Public | Reset with token |
| GET | `/me` | Any | Get current user profile |

### CRM — `/api/v1/crm/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/leads` | Member+ | List leads (own or team based on role) |
| POST | `/leads` | Member+ | Create lead |
| GET | `/leads/:id` | Member+ | Get lead detail |
| PATCH | `/leads/:id` | Member+ | Update lead |
| DELETE | `/leads/:id` | Operator+ | Soft-delete lead |
| POST | `/leads/:id/notes` | Member+ | Add note |
| GET | `/leads/:id/activities` | Member+ | Get activity timeline |
| PATCH | `/leads/:id/stage` | Member+ | Move pipeline stage |
| POST | `/leads/:id/tags` | Member+ | Add/remove tags |
| GET | `/pipeline` | Member+ | Get pipeline view (grouped by stage) |
| GET | `/tags` | Member+ | List tenant tags |

### Funnel — `/api/v1/funnel/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/templates` | Member+ | List funnel templates |
| POST | `/templates` | Operator+ | Create template |
| GET | `/funnels` | Member+ | List my funnels |
| POST | `/funnels` | Member+ | Create funnel from template |
| PATCH | `/funnels/:id` | Owner | Update funnel config |
| POST | `/funnels/:id/publish` | Owner | Publish funnel |
| GET | `/f/:slug` | Public | Render public funnel page (SSR) |
| POST | `/f/:slug/submit` | Public | Submit funnel form (create lead) |

### AI — `/api/v1/ai/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/generate/content` | Member+ | Generate social content |
| POST | `/generate/funnel-copy` | Member+ | Generate funnel text |
| POST | `/generate/whatsapp-reply` | Member+ | Generate WhatsApp reply |
| POST | `/analyze/lead` | Member+ | AI lead analysis |
| POST | `/coach` | Member+ | AI coaching suggestion |
| GET | `/prompts` | Operator+ | List AI prompt templates |
| POST | `/prompts` | Operator+ | Create prompt template |
| PATCH | `/prompts/:id` | Operator+ | Update prompt template |

### Automation — `/api/v1/automation/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/sequences` | Leader+ | List WhatsApp sequences |
| POST | `/sequences` | Leader+ | Create sequence |
| PATCH | `/sequences/:id` | Leader+ | Update sequence |
| POST | `/messages/send` | Member+ | Send single WhatsApp message |
| GET | `/reminders` | Member+ | Get follow-up reminders |
| POST | `/webhooks/whatsapp` | System | Inbound WhatsApp webhook |

### Member — `/api/v1/member/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/onboarding` | Member+ | Get onboarding checklist |
| PATCH | `/onboarding/:step` | Member+ | Complete onboarding step |
| GET | `/daily-actions` | Member+ | Get today's actions |
| PATCH | `/daily-actions/:id` | Member+ | Mark action complete |
| GET | `/training` | Member+ | Get training modules |
| PATCH | `/training/:moduleId` | Member+ | Update training progress |

### Team — `/api/v1/team/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/tree` | Member+ | Get sponsor tree (scoped by role) |
| GET | `/performance` | Leader+ | Team performance metrics |
| GET | `/activity` | Leader+ | Team activity feed |

### Admin — `/api/v1/admin/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/users` | Operator+ | List tenant users |
| PATCH | `/users/:id` | Operator+ | Update user (role, status) |
| POST | `/users/:id/approve` | Operator+ | Approve pending member |
| GET | `/settings` | Operator+ | Get tenant settings |
| PATCH | `/settings` | Operator+ | Update tenant settings |
| GET | `/analytics/overview` | Operator+ | Dashboard analytics |

### Voice — `/api/v1/voice/`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/upload` | Member+ | Upload voice recording |
| GET | `/profiles` | Member+ | List voice profiles |
| POST | `/profiles/:id/extract` | Member+ | Trigger AI extraction |

## Data Flow

```
[Client] → [Next.js API Route]
    → authMiddleware (verify JWT)
    → tenantMiddleware (resolve tenant)
    → permissionMiddleware (check role)
    → rateLimitMiddleware (check quota)
    → [Service Layer] → [Prisma] → [PostgreSQL]
    → [Response: { success, data, error, meta }]
```

## Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 42 }
}

// Error
{
  "success": false,
  "error": {
    "code": "LEAD_NOT_FOUND",
    "message": "Lead with this ID does not exist",
    "status": 404
  }
}
```

## Technical Considerations

- Pagination: cursor-based for lists (`?cursor=xxx&limit=20`)
- Filtering: query params (`?stage=new&tag=health&q=search_term`)
- Sorting: `?sort=created_at&order=desc`
- All dates in ISO 8601 UTC; frontend converts to local
- File uploads via multipart/form-data to Supabase Storage, return URL

## Future Expansion

- GraphQL gateway for mobile app
- WebSocket for real-time dashboard updates (Supabase Realtime)
- Batch API for bulk lead import

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| API sprawl | Strict module namespacing, document every endpoint here |
| Breaking changes | Version prefix, deprecation notices, changelog |
| Over-fetching | Use `?fields=` parameter for selective field return |
