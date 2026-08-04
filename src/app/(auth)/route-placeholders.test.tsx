/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getAuthUserMock, redirectMock } = vi.hoisted(() => ({
  getAuthUserMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/modules/auth/services/auth-service', () => ({
  getAuthUser: getAuthUserMock,
}));

import AdsPage from './ads/page';
import FollowPage from './follow/page';
import PostPage from './post/page';

afterEach(() => {
  cleanup();
});

describe('user-shell route placeholders', () => {
  beforeEach(() => {
    getAuthUserMock.mockResolvedValue({ role: 'member' });
    redirectMock.mockImplementation((destination: string) => {
      throw new Error(`redirect:${destination}`);
    });
  });

  it.each([
    ['内容页', PostPage, '马上就好', '内容准备好后，会直接放在这里。'],
    ['跟进页', FollowPage, '马上就好', '需要跟进的人，会直接排在这里。'],
    ['广告页', AdsPage, '即将开放', '广告陪驾准备好后，会直接放在这里。'],
  ])('renders the %s placeholder without additional actions', async (_name, Page, title, description) => {
    render(await Page());

    expect(screen.getByRole('heading', { name: title })).not.toBeNull();
    expect(screen.getByText(description)).not.toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('keeps the platform administrator redirect guard', async () => {
    getAuthUserMock.mockResolvedValue({ role: 'platform_admin' });

    await expect(PostPage()).rejects.toThrow('redirect:/superadmin');
  });
});
