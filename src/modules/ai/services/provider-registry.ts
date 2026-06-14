// Provider Registry — delegates to canonical model-registry
// Phase V5-1: Consolidated. Model metadata lives in @/modules/ai/router/model-registry

import { getProviderSummaries, getFirstAvailableProvider } from '@/modules/ai/router/model-registry';
import type { ProviderInfo } from '../types/requests';

export function getAvailableProviders(): ProviderInfo[] {
  return getProviderSummaries().map(s => ({ ...s }));
}

export function getFirstAvailable(preferredList: string[]): string {
  return getFirstAvailableProvider(preferredList);
}
