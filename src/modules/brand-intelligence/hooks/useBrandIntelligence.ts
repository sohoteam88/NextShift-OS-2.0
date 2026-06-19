'use client';

import { useQuery } from '@tanstack/react-query';
import { brandIntelligenceService } from '../services/intelligence-service';

export function useBrandIntelligence(userId: string) {
  const query = useQuery({
    queryKey: ['brand-intelligence', userId],
    queryFn: () => brandIntelligenceService.getSnapshot(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
