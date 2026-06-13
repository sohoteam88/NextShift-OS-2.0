'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calculateBrandConfidence, type BrandConfidenceResult } from '../brandConfidenceEngine';
import { createEmptySlots, normalizeSlot, SLOT_NAMES, type SlotMap, type SlotName } from '../slotExtractionService';

// ============================================================
// Types
// ============================================================

export interface DialogueMessage {
  role: 'ai' | 'user';
  type: 'text' | 'voice';
  content: string;
  audio_url?: string;
  ts: string;
}

export interface DialogueState {
  messages: DialogueMessage[];
  slots: Record<string, { value: string; status: string }>;
  turn_count: number;
  next_focus: string;
  stuck_counts: Record<string, number>;
  ended_by?: string;
}

export interface InterviewData {
  id: string;
  mode: string;
  status: string;
  answers: Record<string, unknown>;
  extractedProfile: Record<string, unknown> | null;
}

export interface SendMessageResponse {
  interview: InterviewData;
  reply: string;
  is_complete: boolean;
  completion_reason: string | null;
}

// ============================================================
// Helpers
// ============================================================

function readJson<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) throw new Error(message);
  return res.json() as Promise<T>;
}

function extractDialogueState(interview: InterviewData | null): DialogueState | null {
  if (!interview?.answers) return null;
  const answers = interview.answers as Record<string, unknown>;
  const raw = answers['__dialogue'];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as unknown as DialogueState;
}

function extractSlotMap(dialogue: DialogueState | null): SlotMap {
  const slots = createEmptySlots();
  if (!dialogue?.slots) return slots;

  for (const name of SLOT_NAMES) {
    const raw = dialogue.slots[name];
    if (raw) {
      slots[name] = normalizeSlot(raw);
    }
  }
  return slots;
}

// ============================================================
// Hooks
// ============================================================

export function useBrandDiscovery() {
  const queryClient = useQueryClient();

  // Get or create interview
  const interviewQuery = useQuery({
    queryKey: ['brand-discovery', 'interview'],
    queryFn: async () => {
      // First try to get existing
      const getRes = await fetch('/api/v1/brand-builder/interview');
      const getData = await getRes.json();

      if (getData?.data?.id) {
        return getData.data as InterviewData;
      }

      // Create new dialogue interview
      const createRes = await fetch('/api/v1/brand-builder/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'dialogue',
          opening: '你好，我是你的品牌教练 👋 先随便聊聊——你现在在做什么呀？',
        }),
      });
      return readJson<{ data: InterviewData }>(createRes, 'Failed to create interview').then((d) => d.data);
    },
    staleTime: 30_000,
  });

  const interview = interviewQuery.data ?? null;
  const dialogue = extractDialogueState(interview);
  const slots = extractSlotMap(dialogue);
  const confidence: BrandConfidenceResult = calculateBrandConfidence(slots);

  // Map messages to ChatPanel format
  const messages = (dialogue?.messages ?? []).map((msg, i) => ({
    id: `${msg.role}-${i}`,
    role: msg.role,
    content: msg.content,
    timestamp: msg.ts,
  }));

  const isComplete = interview?.status === 'ready_for_analysis' || interview?.status === 'extracted';

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, type = 'text' }: { content: string; type?: 'text' | 'voice' }) => {
      if (!interview?.id) throw new Error('No active interview');
      const res = await fetch(`/api/v1/brand-builder/interview/${interview.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type }),
      });
      return readJson<SendMessageResponse>(res, 'Failed to send message');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-discovery'] });
    },
  });

  // Finish + extract mutation
  const finishInterview = useMutation({
    mutationFn: async () => {
      if (!interview?.id) throw new Error('No active interview');
      const res = await fetch(`/api/v1/brand-builder/interview/${interview.id}/finish`, {
        method: 'POST',
      });
      return readJson<{ data: Record<string, unknown> }>(res, 'Failed to finish interview');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['mission'] });
      queryClient.invalidateQueries({ queryKey: ['mission-engine'] });
    },
  });

  return {
    interview,
    dialogue,
    slots,
    confidence,
    messages,
    isComplete,
    isLoading: interviewQuery.isLoading,
    isError: interviewQuery.isError,
    sendMessage,
    finishInterview,
  };
}
