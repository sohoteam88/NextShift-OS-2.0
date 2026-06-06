# Supabase Setup

NextShift OS uses Supabase for PostgreSQL, Auth, Storage, and Row Level Security.

## Environment Variables

Create `.env.local` from `.env.example` and fill these values from the Supabase dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when available. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is kept for compatibility with existing Supabase projects.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components or `NEXT_PUBLIC_*` variables.

## App Router Client Files

- `src/lib/supabase/client.ts` creates the browser client with `createBrowserClient`.
- `src/lib/supabase/server.ts` creates a per-request server client with cookie support.
- `src/lib/supabase/middleware.ts` refreshes auth cookies through middleware.
- `src/middleware.ts` calls the Supabase session updater.

## Verify Locally

After filling `.env.local`:

```bash
pnpm lint
pnpm build
pnpm dev
```

Then open:

```text
http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Database Setup

The initial production schema is stored in:

```text
supabase/migrations/202606060001_initial_nextshift_schema.sql
```

It creates the first NextShift OS database foundation:

- Tenant and user profile tables
- CRM lead, tag, note, activity, and pipeline tables
- Funnel, WhatsApp sequence, scheduled message, and content tables
- AI prompt template and AI usage log tables
- Daily action, training progress, voice profile, and analytics event tables
- Private helper functions under `app_private`
- Row Level Security policies for tenant isolation

The migration was applied to Supabase project:

```text
ugyeyjxubahhwdouypjf
```

All public application tables must keep RLS enabled.

## MCP Setup

The project includes a project-scoped Supabase MCP configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=ugyeyjxubahhwdouypjf"
    }
  }
}
```

Project ref:

```text
ugyeyjxubahhwdouypjf
```

To authenticate in Claude Code, open a regular terminal from this project and run:

```bash
claude /mcp
```

Then select `supabase` and choose `Authenticate`. Supabase will open a browser OAuth flow. Choose the organization that owns the project.

After authentication, ask the agent to verify access with a read-only command first, for example:

```text
Use Supabase MCP to list tables for this project.
```

## Security Notes

- Enable RLS on every tenant-scoped table.
- Store authorization data in Supabase `app_metadata`, not user-editable metadata.
- Use verified `getUser()` results for authorization-sensitive server checks.
- Keep tenant isolation in both application queries and database policies.
- Keep MCP manually approved for tool calls. Review SQL before allowing execution.
