'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';

export type WhatsAppReplyInput = {
  leadId: string;
  messageContext: string;
  language?: 'zh' | 'en' | 'ms';
};

export function useWhatsAppReply() {
  const [replies, setReplies] = React.useState<Array<{ label: string; text: string }>>([]);
  const mutation = useMutation({
    mutationFn: async (input: WhatsAppReplyInput) => {
      const res = await fetch('/api/v1/ai/generate/whatsapp-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to generate reply');
      }
      return res.json() as Promise<{
        data: {
          replies: Array<{ label: string; text: string }>;
          leadContext: { name: string; stage: string; score: number };
          tokensUsed: number;
          provider: string;
          model: string;
        };
      }>;
    },
    onSuccess: (data) => setReplies(data.data.replies),
  });

  return {
    suggest: mutation.mutateAsync,
    isLoading: mutation.isPending,
    replies,
    error: mutation.error,
    reset: mutation.reset,
  };
}
