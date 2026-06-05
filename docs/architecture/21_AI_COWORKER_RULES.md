# 21 — AI Coworker Rules

> Operating rules for Claude Code, Codex, or any AI assistant building NextShift OS.

---

## 1. Purpose

Ensure AI-assisted development stays aligned with the architecture, produces consistent code, and never introduces drift or regressions.

---

## 2. The Prime Directive

**Read before you write. Always.**

Before writing any code, the AI coworker MUST read the relevant architecture documents. No exceptions.

---

## 3. Pre-Coding Checklist

Before starting ANY coding task, check:

| Question | Action if Yes |
|----------|---------------|
| Does this touch the database? | Read `07_DATABASE_ARCHITECTURE.md`. Update it if adding/changing tables. |
| Does this add a new feature or module? | Read `04_MODULE_ARCHITECTURE.md`. Verify the module exists or propose adding it. |
| Does this create UI? | Read `14_UI_UX_ARCHITECTURE.md`. Use existing components. Follow layout patterns. |
| Does this involve AI prompts? | Read `09_AI_ARCHITECTURE.md`. Use the prompt template system. |
| Does this add API endpoints? | Read `08_API_ARCHITECTURE.md`. Follow the response format and auth pattern. |
| Is this user-facing? | Read `15_I18N_ARCHITECTURE.md`. Add strings for zh, en, ms. |
| Does this handle user data? | Read `17_SECURITY_ARCHITECTURE.md`. Respect RLS and data classification. |
| Does this affect roles/permissions? | Read `05_USER_ROLES_AND_PERMISSIONS.md`. Update permission matrix if needed. |

---

## 4. Coding Rules

### 4.1 TypeScript

- `strict: true` — no `any`, no implicit returns
- Zod schemas for all input validation
- Infer types from Zod: `type X = z.infer<typeof XSchema>`
- All functions explicitly typed (params + return)

### 4.2 Components

- Use existing atoms/molecules from `components/ui/` and `components/molecules/`
- Do NOT create a new Button, Input, Badge, etc. — use the design system
- Follow the component hierarchy: atom → molecule → organism
- All text must use `useTranslations()` — never hardcode strings

### 4.3 API Routes

- Follow the pattern in `19_ENGINEERING_STANDARDS.md` § 4
- Always: auth → validate → authorize → service → respond
- Use service layer for business logic — not in route handlers
- Return `{ data, meta }` for success, `{ error: { code, message } }` for errors

### 4.4 Database

- Never write raw SQL with user input
- Use Prisma client exclusively
- Always filter by `tenant_id` (RLS is a safety net, not the primary filter)
- Update `07_DATABASE_ARCHITECTURE.md` before running `prisma migrate`

### 4.5 Styling

- Tailwind utilities only — no custom CSS files per component
- Use design tokens (CSS variables) for colors, spacing
- Use `cn()` helper for conditional classes
- Mobile-first: start with mobile layout, add `md:` / `lg:` for larger screens

---

## 5. Architecture-First Workflow

```
1. Receive task
2. Identify which architecture docs are relevant
3. Read those docs
4. Plan the implementation (files to create/modify)
5. Check for conflicts with existing architecture
6. Write the code
7. Update architecture docs if anything changed
8. Write or update tests
9. Verify i18n strings are complete
10. Verify role-based access is correct
```

---

## 6. What NOT To Do

| Forbidden Action | Why |
|------------------|-----|
| Add a database table without updating `07_DATABASE_ARCHITECTURE.md` | Creates architecture drift |
| Create a new UI component that duplicates an existing one | Fragments the design system |
| Hardcode strings in any language | Breaks i18n; makes translation impossible |
| Skip tenant_id filtering in queries | Security vulnerability: cross-tenant data leak |
| Use `any` type | Defeats TypeScript's purpose |
| Add a dependency without justification | Bloat; potential security risk |
| Write business logic in API route handlers | Untestable; violates separation of concerns |
| Modify architecture docs to match bad code | Fix the code, not the docs |
| Assume a role has access without checking `05` | Privilege escalation risk |
| Create API endpoints outside the `/api/v1/` namespace | Breaks API architecture |

---

## 7. When Stuck

1. Re-read the relevant architecture doc
2. Look at existing similar implementations in the codebase
3. If the architecture doesn't cover the case, propose an addition — don't improvise
4. Ask the developer (Steven) rather than guessing on business logic

---

## 8. File Modification Protocol

### When modifying existing files:

1. Read the current file first
2. Understand its purpose and patterns
3. Make minimal, focused changes
4. Preserve existing patterns — don't refactor while implementing features
5. If refactoring is needed, do it as a separate task

### When creating new files:

1. Follow the folder structure in `04_MODULE_ARCHITECTURE.md`
2. Use the naming conventions in `19_ENGINEERING_STANDARDS.md`
3. Include imports from the correct module paths
4. Add exports to the module's barrel file if applicable

---

## 9. Multi-language Rule

Every user-facing string MUST exist in all three locale files:

```
src/messages/zh.json  ← always add first (primary language)
src/messages/en.json  ← add English translation
src/messages/ms.json  ← add Malay translation
```

If unsure of the Malay translation, add the English version with a `// TODO: ms translation` comment in the commit.

---

## 10. Role Awareness

Every feature must consider all four roles:

| Role | Question to Ask |
|------|-----------------|
| Member | Can they access this? What data do they see? |
| Leader | Do they see their downline's data? |
| Operator | Do they see all tenant data? Can they configure this? |
| Platform Admin | Is there a system-wide view needed? |

If a feature is member-only, still ensure the API rejects leader/operator access attempts gracefully (or allows them as expected per the permission matrix).

---

**Cross-references:** `19_ENGINEERING_STANDARDS.md` (coding standards), `04_MODULE_ARCHITECTURE.md` (module structure), All architecture documents (read before coding)
