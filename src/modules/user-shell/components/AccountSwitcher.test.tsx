/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccountSwitcher } from './AccountSwitcher';

afterEach(() => {
  cleanup();
});

describe('AccountSwitcher', () => {
  it('renders nothing when there are zero or one enabled accounts', () => {
    const { rerender, container } = render(<AccountSwitcher accounts={[]} />);
    expect(container.innerHTML).toBe('');

    rerender(<AccountSwitcher accounts={[{ id: 'one', name: '第一个号', enabled: true }]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders enabled account names without internal category labels', () => {
    const { container } = render(
      <AccountSwitcher
        accounts={[
          { id: 'one', name: 'Steven｜20年在家工作', enabled: true },
          { id: 'two', name: '每天一杯，慢慢变好', enabled: true },
          { id: 'three', name: '已暂停的账号', enabled: false },
        ]}
      />,
    );

    expect(screen.getByText('Steven｜20年在家工作')).not.toBeNull();
    expect(screen.getByText('每天一杯，慢慢变好')).not.toBeNull();
    expect(screen.queryByText('已暂停的账号')).toBeNull();
    expect(container.textContent).not.toContain('招募');
    expect(container.textContent).not.toContain('零售');
  });
});
