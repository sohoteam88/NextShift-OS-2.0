// Re-export barrel — split into focused service files (V6-7B)
// Original 486-line file decomposed into:
//   user-management.ts  (listUsers, updateUser, resetUserPassword, deleteUser)
//   settings-service.ts (getTenantStats, getTenantSettings, updateTenantSettings)

import { deleteUser, listUsers, resetUserPassword, updateUser } from './user-management';
import { getTenantStats, getTenantSettings, updateTenantSettings } from './settings-service';

export const adminService = {
  listUsers,
  updateUser,
  resetUserPassword,
  deleteUser,
  getTenantStats,
  getTenantSettings,
  updateTenantSettings,
};
