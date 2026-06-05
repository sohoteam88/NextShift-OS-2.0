# 19 — Engineering Standards

> Code style, testing strategy, Git workflow, and quality gates for NextShift OS.

---

## 1. Purpose

Establish consistent engineering practices so any developer (human or AI) produces code that is uniform, testable, reviewable, and maintainable.

---

## 2. Code Style

### 2.1 Language & Formatter

| Tool | Config |
|------|--------|
| Language | TypeScript (strict mode) |
| Formatter | Prettier (default settings + `printWidth: 100`, `singleQuote: true`) |
| Linter | ESLint (Next.js preset + `@typescript-eslint/recommended`) |
| Import order | `eslint-plugin-import` with groups: builtin → external → internal → relative |

### 2.2 Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files — components | PascalCase | `LeadCard.tsx` |
| Files — utilities | camelCase | `formatDate.ts` |
| Files — API routes | kebab-case folders | `api/v1/crm/leads/route.ts` |
| Variables/functions | camelCase | `getLeadScore()` |
| Types/Interfaces | PascalCase, no `I` prefix | `Lead`, `CreateLeadInput` |
| Enums | PascalCase members | `LeadStage.Contacted` |
| DB columns | snake_case | `created_at`, `tenant_id` |
| Env variables | SCREAMING_SNAKE | `DATABASE_URL` |
| CSS classes | Tailwind utilities | `className="text-sm font-medium"` |

### 2.3 TypeScript Rules

- `strict: true` in tsconfig
- No `any` — use `unknown` and narrow
- All function parameters and return types explicitly typed
- Zod schemas as the source of truth for runtime validation; infer TS types from them:
  ```ts
  const CreateLeadSchema = z.object({ name: z.string(), ... });
  type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
  ```

---

## 3. Project Structure Rules

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── (auth)/           # Auth-required layout group
│   ├── (public)/         # Public pages (funnel renderer)
│   └── api/v1/           # API routes
├── modules/              # Feature modules (see 04_MODULE_ARCHITECTURE.md)
│   ├── crm/
│   │   ├── components/   # CRM-specific components
│   │   ├── hooks/        # CRM-specific hooks
│   │   ├── services/     # Business logic
│   │   ├── schemas/      # Zod validation schemas
│   │   └── types.ts      # CRM types
│   ├── funnel/
│   ├── ai/
│   └── ...
├── components/           # Shared UI components (atoms, molecules)
├── hooks/                # Shared hooks
├── lib/                  # Shared utilities (db client, auth helpers, cn)
├── stores/               # Zustand stores
├── messages/             # i18n translation files
└── styles/               # Global CSS + design tokens
```

### 3.1 Import Rules

- **No circular imports** between modules
- Modules import from `components/`, `hooks/`, `lib/` (shared) — never from other modules directly
- Cross-module communication via shared types or API calls
- Barrel exports (`index.ts`) only at module root, not in subfolders

---

## 4. API Route Standards

```ts
// src/app/api/v1/crm/leads/route.ts

export async function GET(request: NextRequest) {
  // 1. Auth + tenant extraction
  const { userId, tenantId, role } = await requireAuth(request);

  // 2. Input validation
  const query = LeadQuerySchema.parse(getSearchParams(request));

  // 3. Authorization check
  requireRole(role, ['member', 'leader', 'operator']);

  // 4. Business logic (in service layer)
  const result = await leadService.list(tenantId, userId, role, query);

  // 5. Response
  return NextResponse.json({ data: result.items, meta: result.meta });
}
```

### 4.1 Response Format

```json
// Success
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }

// Error
{ "error": { "code": "LEAD_NOT_FOUND", "message": "Lead not found" } }
```

### 4.2 Error Handling

- Service layer throws typed errors: `throw new AppError('LEAD_NOT_FOUND', 404)`
- API route catches → returns structured error response
- Never expose stack traces in production
- Log errors with context (tenant, user, endpoint)

---

## 5. Testing Strategy

### 5.1 Test Pyramid

| Layer | Tool | Coverage target | What to test |
|-------|------|-----------------|--------------|
| Unit | Vitest | 80% of services | Business logic, scoring, schema validation |
| Integration | Vitest + test DB | Key flows | API routes with real DB, auth middleware |
| E2E | Playwright | Critical paths | Login → create lead → move pipeline → generate content |

### 5.2 Test File Location

Co-located with source:

```
src/modules/crm/services/leadService.ts
src/modules/crm/services/leadService.test.ts
```

### 5.3 Test Naming

```ts
describe('LeadService', () => {
  describe('calculateScore', () => {
    it('should add 10 points when lead has phone number', () => { ... });
    it('should cap score at 100', () => { ... });
    it('should return 0 for empty lead', () => { ... });
  });
});
```

### 5.4 Test Database

- Use a separate Supabase project or local PostgreSQL for tests
- Run `prisma migrate reset` before test suite
- Factory functions for test data: `createTestTenant()`, `createTestLead()`

---

## 6. Git Workflow

### 6.1 Branch Strategy

```
main          ← production deployments (protected)
  └── dev     ← integration branch
       ├── feat/crm-pipeline-board
       ├── feat/ai-content-generator
       ├── fix/lead-scoring-bug
       └── chore/update-dependencies
```

### 6.2 Branch Naming

```
feat/module-description     # New feature
fix/module-description      # Bug fix
chore/description           # Dependencies, config, docs
refactor/module-description # Code restructure (no behavior change)
```

### 6.3 Commit Messages

Conventional Commits format:

```
feat(crm): add lead scoring calculation
fix(funnel): correct WhatsApp CTA link generation
chore(deps): update next.js to 14.2
docs(arch): add voice capture architecture
refactor(ai): extract provider adapter interface
```

### 6.4 PR Requirements

- [ ] Linked to issue or architecture doc
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Lint clean
- [ ] Architecture docs updated if schema/API/module changed
- [ ] i18n strings added for all three locales

---

## 7. Quality Gates (CI)

```yaml
# Runs on every PR
- pnpm lint              # ESLint
- pnpm type-check        # tsc --noEmit
- pnpm test              # Vitest unit + integration
- pnpm build             # Next.js production build
```

Merge blocked if any gate fails.

---

## 8. Documentation Rules

- Every module has a `README.md` explaining its purpose, main files, and how to test
- API routes have JSDoc comments on the handler function
- Complex business logic has inline comments explaining *why*, not *what*
- Architecture docs are updated *before* or *with* the code change, not after

---

## 9. Dependency Management

- Package manager: pnpm (lockfile committed)
- Update dependencies monthly; run `pnpm audit` weekly
- No adding dependencies without justification — prefer standard library or existing deps
- Pin major versions; allow minor/patch auto-updates

---

## 10. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| AI coworker ignores standards | `21_AI_COWORKER_RULES.md` + AGENTS.md enforces pre-read |
| Test coverage drops over time | CI reports coverage; block merge below 70% |
| Over-engineering early | MVP-first mindset; refactor when scaling demands it |

---

**Cross-references:** `04_MODULE_ARCHITECTURE.md` (folder structure), `21_AI_COWORKER_RULES.md` (AI coding rules), `18_DEPLOYMENT_ARCHITECTURE.md` (CI/CD pipeline)
