# Database Schema

## Source Of Truth

The active database architecture is documented in:

- `docs/architecture/07_DATABASE_ARCHITECTURE.md`
- `prisma/schema.prisma`
- `supabase/migrations/202606060001_initial_nextshift_schema.sql`

## Core Areas

- Tenants
- Users
- CRM leads
- Pipeline stages
- Tags, notes, and activities
- Funnel templates and funnels
- AI prompt templates and usage logs
- WhatsApp sequences and scheduled messages
- Daily actions and training progress
- Content and voice profiles
- Analytics events

## Rules

- All tenant-scoped tables must enforce tenant isolation.
- Public schema tables must keep RLS enabled.
- Auth, permissions, and multi-tenant changes require architecture review.
