'use client';

import { useQuery } from '@tanstack/react-query';

export type TodayRecommendation = {
  recommendation: {
    id: string;
    title: string;
    summary: string;
    rationale: string;
    route?: string;
    ctaLabel?: string;
  };
  confidence: number;
  explain: string;
  source: 'engine' | 'rule';
};

export async function fetchTodayRecommendation() {
  const response = await fetch('/api/v1/dashboard/recommendation');
  if (!response.ok) throw new Error('Failed to load today recommendation');
  const json = await response.json() as { data: TodayRecommendation | null };
  return json.data;
}

export function useDashboardRecommendation() {
  return useQuery({
    queryKey: ['dashboard-recommendation'],
    queryFn: fetchTodayRecommendation,
    staleTime: 60_000,
    retry: false,
  });
}
