/**
 * @deprecated Import from '@/modules/funnel/services/funnel-health-service' instead.
 * Use `funnelHealthService.getPackageAdvisor(health)` for the same functionality.
 *
 * Phase 2c: Consolidated into canonical next-action engine.
 * This file remains as a re-export for backward compatibility.
 */

import type { FunnelHealth } from './types';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';

export function getFunnelAdvisor(health: FunnelHealth): string[] {
  return funnelHealthService.getPackageAdvisor(health).recommendations;
}

export function getNextBestAction(health: FunnelHealth): string {
  return funnelHealthService.getPackageAdvisor(health).nextAction;
}
