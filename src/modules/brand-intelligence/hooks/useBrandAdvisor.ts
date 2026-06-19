'use client';

import { useQuery } from '@tanstack/react-query';

export function useBrandAdvisor(userId: string) {
  const query = useQuery({
    queryKey: ['brand-advisor', userId],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-intelligence/advisor');
      if (!res.ok) throw new Error('Failed to fetch Brand Intelligence advisor');
      return res.json() as Promise<{ data: import('../types/brand-intelligence').BrandAdvisorSnapshot }>;
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
