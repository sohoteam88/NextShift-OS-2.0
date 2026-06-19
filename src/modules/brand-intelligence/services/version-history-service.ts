import { getBrandVersionHistorySnapshot } from '../projections/brand-version-history-projection';

export const versionHistoryService = {
  getSnapshot: getBrandVersionHistorySnapshot,
};
