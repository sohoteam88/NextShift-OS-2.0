'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FunnelConfig } from '../types';

export type FunnelRow = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  config: FunnelConfig;
  views: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
  template: { id: string; name: string; type: string } | null;
};

export type TemplateRow = {
  id: string;
  name: string;
  type: string;
  config: FunnelConfig;
  thumbnail?: string;
};

export function useFunnels(params?: { status?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);

  return useQuery({
    queryKey: ['funnels', params],
    queryFn: async () => {
      const res = await fetch(`/api/v1/funnel/funnels?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch funnels');
      return res.json() as Promise<{ data: FunnelRow[] }>;
    },
  });
}

export function useFunnel(id: string) {
  return useQuery({
    queryKey: ['funnel', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/funnel/funnels/${id}`);
      if (!res.ok) throw new Error('Failed to fetch funnel');
      return res.json() as Promise<{ data: FunnelRow }>;
    },
    enabled: !!id,
  });
}

export function useFunnelTemplates(type?: string) {
  return useQuery({
    queryKey: ['funnel-templates', type],
    queryFn: async () => {
      const qs = type ? `?type=${type}` : '';
      const res = await fetch(`/api/v1/funnel/templates${qs}`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json() as Promise<{ data: TemplateRow[] }>;
    },
  });
}

export function useCreateFunnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; template_id?: string; config?: object }) => {
      const res = await fetch('/api/v1/funnel/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to create funnel');
      }
      return res.json() as Promise<{ data: FunnelRow }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnels'] }),
  });
}

export function useUpdateFunnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ title: string; config: object; status: string }> }) => {
      const res = await fetch(`/api/v1/funnel/funnels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update funnel');
      return res.json() as Promise<{ data: FunnelRow }>;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['funnel', id] });
      qc.invalidateQueries({ queryKey: ['funnels'] });
    },
  });
}

export function usePublishFunnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, unpublish }: { id: string; unpublish?: boolean }) => {
      const res = await fetch(`/api/v1/funnel/funnels/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unpublish ? { action: 'unpublish' } : {}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['funnel', id] });
      qc.invalidateQueries({ queryKey: ['funnels'] });
    },
  });
}

export function useDeleteFunnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/funnel/funnels/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete funnel');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnels'] }),
  });
}
