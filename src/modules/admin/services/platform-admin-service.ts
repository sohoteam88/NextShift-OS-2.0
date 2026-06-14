// Re-export barrel — split into focused service files (V6-7 Phase A)
// Original 599-line file decomposed into:
//   tenant-management.ts  (listTenants, getTenantDetail, createTenant, updateTenant, suspendTenant, upgradeTenant)
//   platform-stats.ts     (getPlatformStats)
//   ai-analytics.ts       (getAICostBreakdown, getAIModelBreakdown)
//   platform-health.ts    (listAllUsers, getRecentAuditLogs)

import { listTenants, getTenantDetail, suspendTenant, upgradeTenant, createTenant, updateTenant } from './tenant-management';
import { getPlatformStats } from './platform-stats';
import { getAICostBreakdown, getAIModelBreakdown } from './ai-analytics';
import { listAllUsers, getRecentAuditLogs } from './platform-health';

export const platformAdminService = {
  listTenants,
  getTenantDetail,
  createTenant,
  updateTenant,
  suspendTenant,
  upgradeTenant,
  getPlatformStats,
  getAICostBreakdown,
  getAIModelBreakdown,
  listAllUsers,
  getRecentAuditLogs,
};
