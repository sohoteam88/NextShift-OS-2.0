'use client';

import { useEffect, useState } from 'react';
import { trackDiscussionTurnSent } from '@/lib/telemetry/tracker';
import type { TodayRecommendation } from './useDashboardRecommendation';

export type DiscussionMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type DiscussionErrorKind = 'quota' | 'turns' | 'generic';

export type DiscussionError = {
  kind: DiscussionErrorKind;
};

type DiscussionAvailability = {
  turnsLimit: number;
};

type DiscussionResponse = {
  reply: string;
  turnsUsed: number;
  turnsLimit: number;
};

export const DISCUSSION_CHARACTER_LIMIT = 1_500;
export const DEFAULT_DISCUSSION_TURNS_LIMIT = 5;

export class DiscussionRequestError extends Error {
  kind: DiscussionErrorKind;

  constructor(kind: DiscussionErrorKind) {
    super(kind);
    this.name = 'DiscussionRequestError';
    this.kind = kind;
  }
}

export async function fetchDiscussionAvailability() {
  const response = await fetch('/api/v1/dashboard/recommendation/discuss');
  if (!response.ok) return null;

  const json = await response.json() as { data: DiscussionAvailability | null };
  return json.data;
}

export async function sendDiscussionMessage(message: string, history: DiscussionMessage[]) {
  const response = await fetch('/api/v1/dashboard/recommendation/discuss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const json = await response.json() as DiscussionResponse | { data: null } | {
    error?: { code?: string; message?: string };
  };

  if (!response.ok) {
    const code = 'error' in json ? json.error?.code : undefined;
    if (response.status === 429 && code === 'QUOTA_EXCEEDED') {
      throw new DiscussionRequestError('quota');
    }
    if (response.status === 429 && code === 'TURNS_EXHAUSTED') {
      throw new DiscussionRequestError('turns');
    }
    throw new DiscussionRequestError('generic');
  }

  if ('data' in json && json.data === null) return null;
  return json as DiscussionResponse;
}

export function useRecommendationDiscussion({
  recommendation,
  telemetryUserId,
}: {
  recommendation: TodayRecommendation | null;
  telemetryUserId: string | null;
}) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [input, setInput] = useState('');
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [turnsLimit, setTurnsLimit] = useState(DEFAULT_DISCUSSION_TURNS_LIMIT);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<DiscussionError | null>(null);
  const recommendationId = recommendation?.recommendation.id;

  useEffect(() => {
    let active = true;

    if (!recommendationId) {
      setAvailable(false);
      setOpen(false);
      return () => {
        active = false;
      };
    }

    fetchDiscussionAvailability()
      .then((availability) => {
        if (!active) return;
        setAvailable(Boolean(availability));
        setTurnsLimit(availability?.turnsLimit ?? DEFAULT_DISCUSSION_TURNS_LIMIT);
        if (!availability) setOpen(false);
      })
      .catch(() => {
        if (!active) return;
        setAvailable(false);
        setOpen(false);
      });

    return () => {
      active = false;
    };
  }, [recommendationId]);

  async function submit() {
    const message = input.trim();
    if (!message || message.length > DISCUSSION_CHARACTER_LIMIT || sending) return;

    setSending(true);
    setError(null);

    try {
      const result = await sendDiscussionMessage(message, messages);
      if (!result) {
        setAvailable(false);
        setOpen(false);
        return;
      }

      if (telemetryUserId && recommendationId) {
        trackDiscussionTurnSent(telemetryUserId, {
          recommendationId,
          turnNumber: result.turnsUsed,
        });
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'user', content: message },
        { role: 'assistant', content: result.reply },
      ]);
      setInput('');
      setTurnsUsed(result.turnsUsed);
      setTurnsLimit(result.turnsLimit);
    } catch (caughtError) {
      if (caughtError instanceof DiscussionRequestError) {
        setError({ kind: caughtError.kind });
      } else {
        setError({ kind: 'generic' });
      }
    } finally {
      setSending(false);
    }
  }

  return {
    available,
    open,
    messages,
    input,
    turnsUsed,
    turnsLimit,
    sending,
    error,
    toggle: () => setOpen((value) => !value),
    setInput,
    submit,
  };
}
