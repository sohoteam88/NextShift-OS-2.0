'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, MessageCircle, Send, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import {
  fetchTelemetryUserId,
  trackDiscussionTurnSent,
  trackRecommendationClicked,
  trackRecommendationViewed,
} from '@/lib/telemetry/tracker';

export type TodayRecommendation = {
  recommendation: {
    id: string;
    title: string;
    summary: string;
    rationale: string;
    route?: string;
    ctaLabel?: string;
  };
  confidence: number;
  explain: string;
  source: 'engine' | 'rule';
};

export type DiscussionMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type DiscussionErrorKind = 'quota' | 'turns' | 'generic';

export type DiscussionError = {
  kind: DiscussionErrorKind;
  message: string;
};

type DiscussionAvailability = {
  turnsLimit: number;
};

type DiscussionResponse = {
  reply: string;
  turnsUsed: number;
  turnsLimit: number;
};

type TodayRecommendationCardViewProps = {
  recommendation: TodayRecommendation | null;
  isLoading?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
  discussionAvailable?: boolean;
  discussionOpen?: boolean;
  discussionMessages?: DiscussionMessage[];
  discussionInput?: string;
  discussionTurnsUsed?: number;
  discussionTurnsLimit?: number;
  discussionSending?: boolean;
  discussionError?: DiscussionError | null;
  onDiscussionToggle?: () => void;
  onDiscussionInputChange?: (value: string) => void;
  onDiscussionSubmit?: () => void;
};

const h = createElement;
const DISCUSSION_CHARACTER_LIMIT = 1_500;
const DEFAULT_DISCUSSION_TURNS_LIMIT = 5;
const HIGH_CONFIDENCE_THRESHOLD = 0.7;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.5;

class DiscussionRequestError extends Error {
  kind: DiscussionErrorKind;

  constructor(kind: DiscussionErrorKind, message: string) {
    super(message);
    this.name = 'DiscussionRequestError';
    this.kind = kind;
  }
}

async function fetchTodayRecommendation() {
  const response = await fetch('/api/v1/dashboard/recommendation');
  if (!response.ok) throw new Error('Failed to load today recommendation');
  const json = await response.json() as { data: TodayRecommendation | null };
  return json.data;
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
      throw new DiscussionRequestError('quota', '今日 AI 额度已用完');
    }
    if (response.status === 429 && code === 'TURNS_EXHAUSTED') {
      throw new DiscussionRequestError('turns', '本次讨论已达上限,试试执行推荐吧');
    }
    throw new DiscussionRequestError('generic', '暂时无法连接 AI 讨论');
  }

  if ('data' in json && json.data === null) return null;
  return json as DiscussionResponse;
}

function boundedConfidence(confidence: number) {
  const normalized = Number.isFinite(confidence) ? confidence : 0;
  return Math.max(0, Math.min(1, normalized));
}

function sourceLabel(recommendation: TodayRecommendation) {
  if (recommendation.source === 'rule') return '新手引导';
  return boundedConfidence(recommendation.confidence) < MEDIUM_CONFIDENCE_THRESHOLD
    ? '探索性建议'
    : 'AI 分析';
}

function sourceVariant(recommendation: TodayRecommendation) {
  if (recommendation.source === 'rule') return 'success';
  return boundedConfidence(recommendation.confidence) < MEDIUM_CONFIDENCE_THRESHOLD
    ? 'warning'
    : 'info';
}

function confidenceLabel(recommendation: TodayRecommendation) {
  if (recommendation.source === 'rule') return null;
  const confidence = boundedConfidence(recommendation.confidence);
  if (confidence < HIGH_CONFIDENCE_THRESHOLD) return null;
  return `${Math.round(confidence * 100)}%`;
}

function discussionErrorMessage(error: DiscussionError | null | undefined) {
  if (!error) return null;
  if (error.kind === 'quota') return '今日 AI 额度已用完';
  if (error.kind === 'turns') return '本次讨论已达上限,试试执行推荐吧';
  return error.message;
}

export function TodayRecommendationCardView({
  recommendation,
  isLoading = false,
  expanded,
  onToggle,
  onNavigate,
  discussionAvailable = false,
  discussionOpen = false,
  discussionMessages = [],
  discussionInput = '',
  discussionTurnsUsed = 0,
  discussionTurnsLimit = DEFAULT_DISCUSSION_TURNS_LIMIT,
  discussionSending = false,
  discussionError = null,
  onDiscussionToggle,
  onDiscussionInputChange,
  onDiscussionSubmit,
}: TodayRecommendationCardViewProps) {
  if (isLoading || !recommendation) return null;

  const route = recommendation.recommendation.route ?? '/dashboard';
  const ctaLabel = recommendation.recommendation.ctaLabel ?? 'Open recommendation';
  const explain = recommendation.explain || recommendation.recommendation.rationale;
  const inputTooLong = discussionInput.length > DISCUSSION_CHARACTER_LIMIT;
  const errorMessage = discussionErrorMessage(discussionError);
  const confidence = confidenceLabel(recommendation);

  return h(
    'section',
    {
      'aria-label': 'Today\'s Recommendation',
      className: 'rounded-lg border border-border bg-white p-5 shadow-sm',
      'data-testid': 'today-recommendation-card',
    },
    h(
      'div',
      { className: 'flex flex-col gap-4 md:flex-row md:items-start md:justify-between' },
      h(
        'div',
        { className: 'min-w-0 space-y-3' },
        h(
          'div',
          { className: 'flex flex-wrap items-center gap-2' },
          h(
            'span',
            { className: 'inline-flex items-center gap-2 text-xs font-semibold uppercase text-primary' },
            h(Sparkles, { className: 'h-4 w-4', 'aria-hidden': true }),
            'Today\'s Recommendation',
          ),
          h(Badge, { variant: sourceVariant(recommendation) }, sourceLabel(recommendation)),
          confidence ? h(Badge, { variant: 'default' }, confidence) : null,
        ),
        h(
          'div',
          null,
          h(
            'h2',
            { className: 'text-xl font-semibold leading-tight text-foreground' },
            recommendation.recommendation.title,
          ),
          h(
            'p',
            { className: 'mt-2 text-sm leading-relaxed text-muted' },
            recommendation.recommendation.summary,
          ),
        ),
      ),
      h(
        'div',
        { className: 'flex shrink-0 flex-wrap items-center gap-2' },
        discussionAvailable
          ? h(
            Button,
            {
              type: 'button',
              variant: 'secondary',
              size: 'sm',
              icon: h(MessageCircle, { className: 'h-4 w-4', 'aria-hidden': true }),
              onClick: onDiscussionToggle,
              'aria-expanded': discussionOpen,
              'aria-controls': 'today-recommendation-discussion',
            },
            '和 AI 讨论',
          )
          : null,
        h(
          Button,
          {
            type: 'button',
            onClick: () => onNavigate(route),
            size: 'sm',
          },
          ctaLabel,
        ),
      ),
    ),
    h(
      'div',
      { className: 'mt-4 border-t border-border pt-4' },
      h(
        'button',
        {
          type: 'button',
          className: 'inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground',
          'aria-expanded': expanded,
          'aria-controls': 'today-recommendation-explain',
          onClick: onToggle,
        },
        'Why this recommendation',
        h(ChevronDown, {
          className: cn('h-4 w-4 transition-transform', expanded ? 'rotate-180' : ''),
          'aria-hidden': true,
        }),
      ),
      expanded
        ? h(
          'p',
          {
            id: 'today-recommendation-explain',
            className: 'mt-3 text-sm leading-relaxed text-muted',
          },
          explain,
        )
        : null,
    ),
    discussionAvailable && discussionOpen
      ? h(
        'div',
        {
          id: 'today-recommendation-discussion',
          className: 'mt-4 space-y-4 border-t border-border pt-4',
          'data-testid': 'today-recommendation-discussion',
        },
        h(
          'div',
          { className: 'flex items-center justify-between gap-3' },
          h('h3', { className: 'text-sm font-semibold text-foreground' }, '和 AI 讨论'),
          h(
            Badge,
            { variant: discussionTurnsUsed >= discussionTurnsLimit ? 'warning' : 'info' },
            `第 ${discussionTurnsUsed}/${discussionTurnsLimit} 轮`,
          ),
        ),
        h(
          'div',
          { className: 'space-y-3', 'aria-live': 'polite' },
          discussionMessages.length === 0
            ? h('p', { className: 'text-sm text-muted' }, '当前还没有讨论内容。')
            : discussionMessages.map((message, index) => h(
              'div',
              {
                key: `${message.role}-${index}`,
                className: cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                ),
              },
              h(
                'p',
                {
                  className: cn(
                    'max-w-full rounded-lg px-3 py-2 text-sm leading-relaxed md:max-w-lg',
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-foreground',
                  ),
                },
                message.content,
              ),
            )),
          discussionSending
            ? h(
              'div',
              { className: 'flex items-center gap-2 text-sm text-muted' },
              h(Spinner, { size: 'sm' }),
              'AI 正在回复',
            )
            : null,
        ),
        errorMessage
          ? h(
            'div',
            {
              className: 'rounded-lg border border-border bg-surface p-3 text-sm text-foreground',
              role: 'alert',
            },
            h('p', null, errorMessage),
            discussionError?.kind === 'turns'
              ? h(
                Button,
                {
                  type: 'button',
                  size: 'sm',
                  className: 'mt-3',
                  onClick: () => onNavigate(route),
                },
                ctaLabel,
              )
              : null,
          )
          : null,
        h(
          'form',
          {
            className: 'space-y-2',
            onSubmit: (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              onDiscussionSubmit?.();
            },
          },
          h(
            'textarea',
            {
              value: discussionInput,
              maxLength: DISCUSSION_CHARACTER_LIMIT + 1,
              rows: 3,
              placeholder: '输入你的问题',
              onChange: (event: ChangeEvent<HTMLTextAreaElement>) => onDiscussionInputChange?.(
                event.currentTarget.value,
              ),
              className: cn(
                'w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20',
                inputTooLong ? 'bg-surface' : '',
              ),
              'aria-invalid': inputTooLong,
              'aria-describedby': 'today-recommendation-discussion-count',
            },
          ),
          h(
            'div',
            { className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
            h(
              'span',
              {
                id: 'today-recommendation-discussion-count',
                className: cn('text-xs', inputTooLong ? 'font-semibold text-foreground' : 'text-muted'),
              },
              `${discussionInput.length}/${DISCUSSION_CHARACTER_LIMIT}`,
            ),
            h(
              Button,
              {
                type: 'submit',
                size: 'sm',
                icon: h(Send, { className: 'h-4 w-4', 'aria-hidden': true }),
                loading: discussionSending,
                disabled: discussionInput.trim().length === 0 || inputTooLong || discussionSending,
              },
              '发送',
            ),
          ),
        ),
      )
      : null,
  );
}

export function TodayRecommendationCard() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [discussionAvailable, setDiscussionAvailable] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionMessages, setDiscussionMessages] = useState<DiscussionMessage[]>([]);
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussionTurnsUsed, setDiscussionTurnsUsed] = useState(0);
  const [discussionTurnsLimit, setDiscussionTurnsLimit] = useState(DEFAULT_DISCUSSION_TURNS_LIMIT);
  const [discussionSending, setDiscussionSending] = useState(false);
  const [discussionError, setDiscussionError] = useState<DiscussionError | null>(null);
  const viewedRecommendationIds = useRef<Set<string>>(new Set());
  const recommendation = useQuery({
    queryKey: ['dashboard-recommendation'],
    queryFn: fetchTodayRecommendation,
    staleTime: 60_000,
    retry: false,
  });
  const telemetryUser = useQuery({
    queryKey: ['telemetry-user-id'],
    queryFn: fetchTelemetryUserId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const telemetryUserId = telemetryUser.data ?? null;

  useEffect(() => {
    let active = true;

    if (!recommendation.data) {
      setDiscussionAvailable(false);
      setDiscussionOpen(false);
      return () => {
        active = false;
      };
    }

    fetchDiscussionAvailability()
      .then((availability) => {
        if (!active) return;
        setDiscussionAvailable(Boolean(availability));
        setDiscussionTurnsLimit(availability?.turnsLimit ?? DEFAULT_DISCUSSION_TURNS_LIMIT);
        if (!availability) setDiscussionOpen(false);
      })
      .catch(() => {
        if (!active) return;
        setDiscussionAvailable(false);
        setDiscussionOpen(false);
      });

    return () => {
      active = false;
    };
  }, [recommendation.data]);

  useEffect(() => {
    const data = recommendation.data;
    if (!data || !telemetryUserId) return;

    const recommendationId = data.recommendation.id;
    if (viewedRecommendationIds.current.has(recommendationId)) return;

    viewedRecommendationIds.current.add(recommendationId);
    trackRecommendationViewed(telemetryUserId, {
      recommendationId,
      source: data.source,
      confidence: data.confidence,
    });
  }, [recommendation.data, telemetryUserId]);

  if (recommendation.isError) return null;

  async function handleDiscussionSubmit() {
    const message = discussionInput.trim();
    if (!message || message.length > DISCUSSION_CHARACTER_LIMIT || discussionSending) return;

    setDiscussionSending(true);
    setDiscussionError(null);

    try {
      const result = await sendDiscussionMessage(message, discussionMessages);
      if (!result) {
        setDiscussionAvailable(false);
        setDiscussionOpen(false);
        return;
      }

      const recommendationId = recommendation.data?.recommendation.id;
      if (telemetryUserId && recommendationId) {
        trackDiscussionTurnSent(telemetryUserId, {
          recommendationId,
          turnNumber: result.turnsUsed,
        });
      }

      setDiscussionMessages((messages) => [
        ...messages,
        { role: 'user', content: message },
        { role: 'assistant', content: result.reply },
      ]);
      setDiscussionInput('');
      setDiscussionTurnsUsed(result.turnsUsed);
      setDiscussionTurnsLimit(result.turnsLimit);
    } catch (error) {
      if (error instanceof DiscussionRequestError) {
        setDiscussionError({ kind: error.kind, message: error.message });
      } else {
        setDiscussionError({ kind: 'generic', message: '暂时无法连接 AI 讨论' });
      }
    } finally {
      setDiscussionSending(false);
    }
  }

  return h(TodayRecommendationCardView, {
    recommendation: recommendation.data ?? null,
    isLoading: recommendation.isLoading,
    expanded,
    onToggle: () => setExpanded((value) => !value),
    onNavigate: (route) => {
      const data = recommendation.data;
      if (telemetryUserId && data) {
        trackRecommendationClicked(telemetryUserId, {
          recommendationId: data.recommendation.id,
          ctaTarget: route,
        });
      }
      router.push(route);
    },
    discussionAvailable,
    discussionOpen,
    discussionMessages,
    discussionInput,
    discussionTurnsUsed,
    discussionTurnsLimit,
    discussionSending,
    discussionError,
    onDiscussionToggle: () => setDiscussionOpen((value) => !value),
    onDiscussionInputChange: setDiscussionInput,
    onDiscussionSubmit: handleDiscussionSubmit,
  });
}
