'use client';

import { useQuery } from '@tanstack/react-query';

export function useBrandVersionHistory(userId: string) {
  const query = useQuery({
    queryKey: ['brand-version-history', userId],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-intelligence/versions');
      if (!res.ok) throw new Error('Failed to fetch Brand Intelligence version history');
      return res.json() as Promise<{ data: import('../types/brand-version').BrandVersionHistorySnapshot }>;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return {
    snapshot: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
