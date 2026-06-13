# Playwright E2E Tests

## Quick Start

```bash
# Install browsers (first time)
npx playwright install

# Run all E2E tests
pnpm e2e

# Run with UI
pnpm e2e:ui

# Run with debugger
pnpm e2e:debug

# Run specific test
pnpm e2e -- tests/e2e/auth.spec.ts
```

## Required Environment Variables

Create `.env.e2e` (never commit real credentials):

```
E2E_BASE_URL=http://localhost:3000
E2E_TEST_USER_EMAIL=test-user@example.test
E2E_TEST_USER_PASSWORD=test-password-123
E2E_ADMIN_EMAIL=admin@example.test
E2E_ADMIN_PASSWORD=admin-password-123
```

If not set, tests use placeholder credentials (will fail against real auth).

## Test Suites

| Suite | File | What It Tests |
|-------|------|---------------|
| Auth | `auth.spec.ts` | Login, logout, redirects, protected routes |
| Mission Engine | `mission-engine.spec.ts` | Dashboard loads, mission visible, progress bar |
| Brand Discovery | `brand-discovery.spec.ts` | Chat loads, confidence display |
| Funnel Context | `funnel-context.spec.ts` | Retail/recruitment/upgrade views |
| Content Engine | `content-engine.spec.ts` | Platform selector, generate button |
| Admin Protection | `admin.spec.ts` | User lockout, admin access |

## CI Integration

In `ci.yml`, E2E runs after `quality` + `test`:

```yaml
e2e:
  needs: [quality, test]
  steps:
    - npx playwright install --with-deps chromium
    - pnpm build && pnpm start &
    - npx wait-on http://localhost:3000/api/v1/health
    - pnpm e2e
```

## Debugging Failed Tests

```bash
# View trace
npx playwright show-trace test-results/.../trace.zip

# View screenshot
open test-results/.../test-finished-1.png
```

## Updating Selectors

Edit `tests/e2e/helpers/selectors.ts`. All test suites reference selectors from here. When UI changes, update selectors once.

## Test Data Strategy

- No real credentials in code — read from `process.env.E2E_*`
- Tests are read-only where possible — no destructive mutations
- Use `beforeEach` to reset state between tests
