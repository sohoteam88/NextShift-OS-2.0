/**
 * @deprecated Import from '@/modules/funnel/services/funnel-health-service' instead.
 * Use `funnelHealthService.getActivityNextAction(funnelType, counts...)` for the same functionality.
 *
 * Phase 2c: Consolidated into canonical next-action engine.
 * This file remains as a re-export for backward compatibility.
 */

import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import type { FunnelNextAction } from '../types/funnel-os';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';

export function getNextAction(
  funnelType: BusinessFunnelType,
  contentCount: number, videoCount: number,
  funnelExists: boolean, leadCount: number, customerCount: number,
): FunnelNextAction {
  return funnelHealthService.getActivityNextAction(funnelType, contentCount, videoCount, funnelExists, leadCount, customerCount);
}
