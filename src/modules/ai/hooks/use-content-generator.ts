'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type ContentGenerateInput = {
  templateId?: string;
  topic: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'xiaohongshu' | 'whatsapp';
  tone?: 'educational' | 'inspirational' | 'personal' | 'professional';
  language?: 'zh' | 'en' | 'ms';
  additionalContext?: string;
};

export function useContentGenerator() {
  return useMutation({
    mutationFn: async (input: ContentGenerateInput) => {
      const res = await fetch('/api/v1/ai/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to generate content');
      }
      return res.json() as Promise<{
        data: {
          content: string;
          platform: string;
          language: string;
          tokensUsed: number;
          provider: string;
          model: string;
          templateId: string;
          templateName: string;
        };
      }>;
    },
  });
}

export function useContentStream() {
  const [streamText, setStreamText] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startStream = React.useCallback(async (input: ContentGenerateInput) => {
    setError(null);
    setStreamText('');
    setIsStreaming(true);

    try {
      const res = await fetch('/api/v1/ai/generate/content/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? 'Failed to stream content');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          const payload = JSON.parse(line.slice(6)) as { text: string; done: boolean };
          if (payload.text) {
            setStreamText((current) => current + payload.text);
          }
          if (payload.done) {
            setIsStreaming(false);
          }
        }
      }
    } catch (streamError) {
      setError(streamError instanceof Error ? streamError.message : 'Failed to stream content');
      setIsStreaming(false);
    }
  }, []);

  return { startStream, streamText, isStreaming, error };
}

export function useSavedContent(filters?: { page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery({
    queryKey: ['ai-content', filters ?? {}],
    queryFn: async () => {
      const res = await fetch(`/api/v1/ai/content?${params}`);
      if (!res.ok) throw new Error('Failed to fetch saved content');
      return res.json() as Promise<{
        data: Array<Record<string, unknown>>;
        meta: { page: number; limit: number; total: number; total_pages: number };
      }>;
    },
  });
}

export function useSaveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      content: string;
      platform: string;
      title?: string;
      status?: 'draft' | 'published';
      language?: 'zh' | 'en' | 'ms';
      promptUsed?: string;
    }) => {
      const res = await fetch('/api/v1/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to save content');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-content'] });
    },
  });
}
