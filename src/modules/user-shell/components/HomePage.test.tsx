/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getHomeTaskPresentation } from '@/modules/user-shell/services/homeTaskPresentation';
import { HomePage } from './HomePage';

afterEach(() => {
  cleanup();
});

describe('HomePage', () => {
  it('keeps pending schedule content neutral instead of inventing a task', () => {
    const presentation = getHomeTaskPresentation({
      type: 'schedule',
      phase: 'business',
      day: 1,
      status: 'content_pending',
    });

    expect(presentation.title).toBe('今天的安排正在准备中');
    expect(presentation.primaryAction).toBe('我知道了');
  });

  it('uses ready schedule content as the task title', () => {
    const presentation = getHomeTaskPresentation({
      type: 'schedule',
      phase: 'experience',
      day: 2,
      status: 'ready',
      content: '开始喝了没有？味道如何？',
    });

    expect(presentation.title).toBe('开始喝了没有？味道如何？');
  });

  it('does not render the progress line when it is null', () => {
    render(
      <HomePage
        todayTask={{
          type: 'schedule',
          phase: 'business',
          day: 1,
          status: 'content_pending',
        }}
        progressLine={null}
      />,
    );

    expect(screen.queryByText(/体验第/)).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('only reveals secondary entries after the primary action is completed', () => {
    render(
      <HomePage
        todayTask={{
          type: 'schedule',
          phase: 'experience',
          day: 2,
          status: 'ready',
          content: '开始喝了没有？味道如何？',
        }}
        progressLine="体验第 2 天 · 今天的奶昔喝了吗？"
      />,
    );

    expect(screen.queryByRole('button', { name: '还想发一条' })).toBeNull();
    expect(screen.queryByRole('button', { name: '看看要跟进谁' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '完成这件事' }));

    expect(screen.getByRole('button', { name: '还想发一条' })).not.toBeNull();
    expect(screen.getByRole('button', { name: '看看要跟进谁' })).not.toBeNull();
  });
});
