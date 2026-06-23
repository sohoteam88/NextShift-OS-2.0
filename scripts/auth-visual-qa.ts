import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseURL = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const email = process.env.E2E_TEST_USER_EMAIL || 'test-user@example.test';
const password = process.env.E2E_TEST_USER_PASSWORD || 'test-password-123';
const outDir = join(process.cwd(), 'test-results', 'visual-authenticated-qa');
const allowSignupFallback = process.env.E2E_ALLOW_SIGNUP_FALLBACK === '1';
const allowProductionSignupFallback = process.env.E2E_ALLOW_PRODUCTION_SIGNUP_FALLBACK === '1';
const isProductionTarget = /^https:\/\/(www\.)?nextshiftos\.com\/?$/i.test(baseURL);

const routes = ['/dashboard', '/journey', '/content-engine', '/leads', '/customers', '/sales', '/ai'];
const viewports = [
  { name: 'desktop', width: 1440, height: 960 },
  { name: 'mobile', width: 390, height: 844 },
];

type Finding = {
  route: string;
  viewport: string;
  url: string;
  title: string;
  issues: string[];
  screenshot: string;
};

async function visibleText(page: Page) {
  return page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
}

async function collectVisualIssues(page: Page) {
  const issues: string[] = [];
  const bodyText = (await visibleText(page)).trim();
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  const zeroSizedVisible = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, input, textarea, select'))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width === 0 && rect.height === 0;
      })
      .length;
  });

  if (!bodyText) issues.push('blank body text');
  if (/Application error|Unhandled Runtime Error|Internal Server Error|404|500/i.test(bodyText)) {
    issues.push('visible error state');
  }
  if (horizontalOverflow) issues.push('horizontal overflow');
  if (zeroSizedVisible > 0) issues.push(`${zeroSizedVisible} visible controls have zero size`);
  return issues;
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });

  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(Number(process.env.E2E_LOGIN_SETTLE_MS ?? 0));
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  const beforeSubmit = {
    url: page.url(),
    emailFilled: Boolean(await page.locator('input[name="email"]').inputValue()),
    passwordFilled: Boolean(await page.locator('input[name="password"]').inputValue()),
  };
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(2000);
  const afterSubmit = {
    url: page.url(),
    bodyText: (await visibleText(page)).slice(0, 500),
    errorText: await page.locator('.text-red-600, [role="alert"]').innerText({ timeout: 1000 }).catch(() => ''),
  };

  await page.screenshot({ path: join(outDir, 'login-after-submit.png'), fullPage: true });

  let authMode: 'login' | 'signup-fallback' | 'none' = !page.url().includes('/login') ? 'login' : 'none';

  if (authMode === 'none' && allowSignupFallback) {
    if (isProductionTarget && !allowProductionSignupFallback) {
      throw new Error(
        'Refusing signup fallback against production. Run scripts/ensure-e2e-user.ts with a real E2E_TEST_USER_EMAIL, then rerun visual QA without E2E_ALLOW_SIGNUP_FALLBACK.',
      );
    }

    const unique = Date.now().toString(36);
    const signupDomain = process.env.E2E_SIGNUP_EMAIL_DOMAIN || 'example.test';
    const signupEmail = `e2e-${unique}@${signupDomain}`;
    const teamName = `E2E ${unique}`;

    await page.goto(`${baseURL}/signup`, { waitUntil: 'networkidle' });
    await page.fill('input[name="owner_name"]', 'E2E Test User');
    await page.fill('input[name="email"]', signupEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="team_name"]', teamName);
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(outDir, 'signup-after-submit.png'), fullPage: true });

    if (!page.url().includes('/signup') && !page.url().includes('/login')) {
      authMode = 'signup-fallback';
    }
  }

  const findings: Finding[] = [];
  const authenticated = authMode !== 'none';

  if (authenticated) {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of routes) {
        await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        const safeRoute = route === '/' ? 'root' : route.slice(1).replaceAll('/', '-');
        const screenshot = join(outDir, `${viewport.name}-${safeRoute}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        findings.push({
          route,
          viewport: viewport.name,
          url: page.url(),
          title: await page.title(),
          issues: await collectVisualIssues(page),
          screenshot,
        });
      }
    }
  }

  await browser.close();

  const report = {
    baseURL,
    authenticated,
    authMode,
    beforeSubmit,
    afterSubmit,
    consoleErrors,
    failedRequests,
    findings,
  };
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
