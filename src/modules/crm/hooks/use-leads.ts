'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type LeadFilters = {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  tag?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export function useLeads(filters: LeadFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });

  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/crm/leads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      return res.json() as Promise<{ data: LeadRow[]; meta: PaginationMeta }>;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/crm/leads/${id}`);
      if (!res.ok) throw new Error('Failed to fetch lead');
      return res.json() as Promise<{ data: LeadDetail }>;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/v1/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to create lead');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/v1/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update lead');
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead', vars.id] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/crm/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ScoringReason = {
  signal: string;
  points: number;
  description: string;
};

export type LeadRow = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  pipelineStage: string;
  score: number;
  scoreReasons: ScoringReason[];
  nextFollowup?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; avatarUrl?: string };
  tags: { tag: { id: string; name: string; color: string } }[];
};

export type ActivityEntry = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string };
};

export type NoteEntry = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
};

export type LeadDetail = LeadRow & {
  nextFollowup?: string | null;
  notes: NoteEntry[];
  activities: ActivityEntry[];
};
