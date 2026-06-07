'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';

export type LeadAnalysisInput = {
  leadId: string;
  language?: 'zh' | 'en' | 'ms';
};

export function useLeadAnalysis() {
  const [analysis, setAnalysis] = React.useState<{
    summary: string;
    engagement_level: 'high' | 'medium' | 'low';
    next_best_action: string;
    talking_points: string[];
    risk_factors: string[];
    estimated_conversion_likelihood: 'high' | 'medium' | 'low';
    recommended_followup_days: number;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: LeadAnalysisInput) => {
      const res = await fetch('/api/v1/ai/generate/lead-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to analyze lead');
      }
      return res.json() as Promise<{
        data: {
          summary: string;
          engagement_level: 'high' | 'medium' | 'low';
          next_best_action: string;
          talking_points: string[];
          risk_factors: string[];
          estimated_conversion_likelihood: 'high' | 'medium' | 'low';
          recommended_followup_days: number;
          tokensUsed: number;
          provider: string;
          model: string;
          templateId: string;
          templateName: string;
        };
      }>;
    },
    onSuccess: (data) => setAnalysis(data.data),
  });

  return {
    analyze: mutation.mutateAsync,
    isLoading: mutation.isPending,
    analysis,
    error: mutation.error,
    reset: mutation.reset,
  };
}
