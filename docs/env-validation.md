# Environment Validation

## Schema

`src/core/env/env.ts` uses Zod to validate all environment variables at startup.

### Required (crash if missing)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `DIRECT_URL` | Direct PostgreSQL connection |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) |

### Optional (missing = provider unavailable)

| Variable | Provider |
|----------|----------|
| `ANTHROPIC_API_KEY` | Anthropic / Claude |
| `OPENAI_API_KEY` | OpenAI |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `MINIMAX_API_KEY` | MiniMax |

## Client-Server Separation

- `getEnv()` — full env access (server only)
- `getClientEnv()` — returns only `NEXT_PUBLIC_*` vars (safe for client)
- Server secrets (API keys, DB URLs) are NEVER exposed to client

## Usage

```typescript
import { getEnv, getClientEnv, getAvailableAIProviders } from '@/core/env/env';

// Server-side
const env = getEnv();
console.log(env.DATABASE_URL); // ✅ accessible

// Check which AI providers are available
const providers = getAvailableAIProviders();
// ['anthropic', 'openai', 'deepseek'] — only those with API keys set

// Client-safe
const clientEnv = getClientEnv();
// { NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY }
```

## Validation Behavior

- **Missing required var** → throws at import time → app fails fast
- **Missing optional AI key** → provider marked unavailable → other providers used via fallback
- **Invalid URL format** → throws with descriptive message

## Environment Files

| File | Purpose |
|------|---------|
| `.env` | Local development (gitignored) |
| `.env.example` | Template for new developers |
| `.env.local` | Local overrides (gitignored) |
| `.env.production` | Production values (gitignored) |
| `.env.production.example` | Production template |
