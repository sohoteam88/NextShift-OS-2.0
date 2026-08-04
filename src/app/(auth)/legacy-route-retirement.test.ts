import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import CrmCenterPage from './crm-center/page';
import RetiredCrmLayout from './crm/layout';
import CustomersPage from './customers/page';
import LeadsPage from './leads/page';
import RetiredMissionWorkspaceLayout from './mission/[missionId]/layout';
import RetiredRevenueDriversLayout from './revenue-drivers/layout';
import RetiredTrafficEngineLayout from './traffic-engine/layout';

describe('legacy user-shell route retirement', () => {
  beforeEach(() => {
    redirectMock.mockImplementation((destination: string) => {
      throw new Error(`redirect:${destination}`);
    });
  });

  it.each([
    ['收入驱动中心', RetiredRevenueDriversLayout],
    ['Mission Workspace', RetiredMissionWorkspaceLayout],
    ['客户关系', RetiredCrmLayout],
    ['增长页七卡', RetiredTrafficEngineLayout],
  ])('redirects the %s route group to the user-shell home', (_name, Layout) => {
    expect(() => Layout({ children: null })).toThrow('redirect:/');
  });

  it.each([
    ['客户关系兼容入口', CrmCenterPage],
    ['客户兼容入口', CustomersPage],
    ['潜在客户兼容入口', LeadsPage],
  ])('redirects the %s to the user-shell home', async (_name, Page) => {
    await expect(Page()).rejects.toThrow('redirect:/');
  });
});
