'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type LeadRow } from './use-leads';

export type FollowupCounts = {
  overdue: number;
  today: number;
  upcoming: number;
};

export type FollowupGroups = {
  overdue: LeadRow[];
  today: LeadRow[];
  upcoming: LeadRow[];
};

export function useFollowupCounts() {
  return useQuery({
    queryKey: ['followup-counts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/followups?mode=counts');
      if (!res.ok) throw new Error('Failed to fetch followup counts');
      return res.json() as Promise<{ data: FollowupCounts }>;
    },
    staleTime: 60_000,
  });
}

export function useFollowups() {
  return useQuery({
    queryKey: ['followups'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/followups');
      if (!res.ok) throw new Error('Failed to fetch followups');
      return res.json() as Promise<{ data: FollowupGroups }>;
    },
  });
}

export function useSetFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, date }: { leadId: string; date: Date | null }) => {
      const res = await fetch(`/api/v1/crm/leads/${leadId}/followup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_followup: date ? date.toISOString() : null }),
      });
      if (!res.ok) throw new Error('Failed to set follow-up');
      return res.json();
    },
    onSuccess: (_, { leadId }) => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['followups'] });
      qc.invalidateQueries({ queryKey: ['followup-counts'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
