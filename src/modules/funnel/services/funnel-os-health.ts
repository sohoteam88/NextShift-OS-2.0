/**
 * @deprecated Import from '@/modules/funnel/services/funnel-health-service' instead.
 * Use `funnelHealthService.evaluateActivity(counts...)` for the same functionality.
 *
 * Phase 2b: Consolidated into canonical health engine.
 * This file remains as a re-export for backward compatibility.
 */

import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';
import type { FunnelHealth } from '../types/funnel-os';

export async function calculateFunnelHealth(
  contentCount: number, videoCount: number,
  funnelExists: boolean, leadCount: number, customerCount: number,
): Promise<FunnelHealth> {
  return funnelHealthService.evaluateActivity(contentCount, videoCount, funnelExists, leadCount, customerCount);
}
