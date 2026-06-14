/**
 * @deprecated Import from '@/modules/funnel/services/funnel-health-service' instead.
 * Use `funnelHealthService.evaluatePackage(pkg)` for the same functionality.
 *
 * Phase 2b: Consolidated into canonical health engine.
 * This file remains as a re-export for backward compatibility.
 */

import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';
import type { FunnelPackage, FunnelHealth } from './types';

export function validateFunnelHealth(pkg: FunnelPackage): FunnelHealth {
  return funnelHealthService.evaluatePackage(pkg);
}
