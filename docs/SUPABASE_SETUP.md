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

## Security Notes

- Enable RLS on every tenant-scoped table.
- Store authorization data in Supabase `app_metadata`, not user-editable metadata.
- Use verified `getUser()` results for authorization-sensitive server checks.
- Keep tenant isolation in both application queries and database policies.
