'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type LeadRow } from './use-leads';

export type PipelineStage = {
  id: string;
  name: string;
  color: string;
  stageOrder: number;
  tenantId: string;
};

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/pipeline-stages');
      if (!res.ok) throw new Error('Failed to fetch stages');
      return res.json() as Promise<{ data: PipelineStage[] }>;
    },
  });
}

export function useLeadsByStage() {
  return useQuery({
    queryKey: ['leads-by-stage'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/leads?limit=200&sort_by=score&sort_order=desc');
      if (!res.ok) throw new Error('Failed to fetch leads');
      const json = (await res.json()) as { data: LeadRow[] };
      const grouped: Record<string, LeadRow[]> = {};
      for (const lead of json.data) {
        const stage = lead.pipelineStage;
        if (!grouped[stage]) grouped[stage] = [];
        grouped[stage].push(lead);
      }
      return grouped;
    },
  });
}

export function useMoveLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pipelineStage }: { id: string; pipelineStage: string }) => {
      const res = await fetch(`/api/v1/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStage }),
      });
      if (!res.ok) throw new Error('Failed to move lead');
      return res.json();
    },
    onMutate: async ({ id, pipelineStage }) => {
      await qc.cancelQueries({ queryKey: ['leads-by-stage'] });
      const prev = qc.getQueryData<Record<string, LeadRow[]>>(['leads-by-stage']);

      qc.setQueryData<Record<string, LeadRow[]>>(['leads-by-stage'], (old) => {
        if (!old) return old;
        const next = { ...old };
        let moved: LeadRow | undefined;
        for (const stage of Object.keys(next)) {
          const idx = next[stage].findIndex((l) => l.id === id);
          if (idx !== -1) {
            [moved] = next[stage].splice(idx, 1);
            next[stage] = [...next[stage]];
            break;
          }
        }
        if (moved) {
          next[pipelineStage] = [...(next[pipelineStage] ?? []), { ...moved, pipelineStage }];
        }
        return next;
      });

      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['leads-by-stage'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['leads-by-stage'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useReorderStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stageIds: string[]) => {
      const res = await fetch('/api/v1/crm/pipeline-stages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_ids: stageIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder stages');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });
}
