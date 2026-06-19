'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useBrandRegeneration(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/brand-dna/regenerate', { method: 'POST' });

      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? 'Failed to regenerate Brand DNA');
      }

      return res.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['brand-dna'] }),
        queryClient.invalidateQueries({ queryKey: ['brand-health', userId] }),
        queryClient.invalidateQueries({ queryKey: ['brand-advisor', userId] }),
        queryClient.invalidateQueries({ queryKey: ['brand-intelligence', userId] }),
      ]);
    },
  });

  return {
    regenerate: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
  };
}
