import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('AUTH-001 legacy AI funnel builder redirect', () => {
  it('redirects the legacy AI funnel route to the canonical funnel builder', async () => {
    const pageUrl = pathToFileURL(
      path.join(process.cwd(), 'src', 'app', '(auth)', 'ai', 'funnel-builder', 'page.tsx'),
    ).href;
    const { default: FunnelBuilderPage } = await import(pageUrl);

    FunnelBuilderPage();

    expect(redirectMock).toHaveBeenCalledWith('/funnel');
  });
});
