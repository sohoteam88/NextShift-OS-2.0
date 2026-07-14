import { createElement } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import type { TodayRecommendation } from '../hooks/useDashboardRecommendation';
import {
  DISCUSSION_CHARACTER_LIMIT,
  type DiscussionError,
  type DiscussionMessage,
} from '../hooks/useRecommendationDiscussion';

type RecommendationDiscussionProps = {
  recommendation: TodayRecommendation;
  open: boolean;
  messages: DiscussionMessage[];
  input: string;
  turnsUsed: number;
  turnsLimit: number;
  sending: boolean;
  error: DiscussionError | null;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onNavigate: (route: string) => void;
};

const h = createElement;

export function RecommendationDiscussion({
  recommendation,
  open,
  messages,
  input,
  turnsUsed,
  turnsLimit,
  sending,
  error,
  onToggle,
  onInputChange,
  onSubmit,
  onNavigate,
}: RecommendationDiscussionProps) {
  const t = useTranslations('dashboard.aiCommand');
  const route = recommendation.recommendation.route ?? '/dashboard';
  const ctaLabel = recommendation.recommendation.ctaLabel ?? t('startMission');
  const inputTooLong = input.length > DISCUSSION_CHARACTER_LIMIT;
  const errorMessage = error?.kind === 'quota'
    ? t('discussionQuotaExceeded')
    : error?.kind === 'turns'
      ? t('discussionTurnsExhausted')
      : error
        ? t('discussionConnectionFailed')
        : null;

  return h(
    'div',
    { className: 'mt-4' },
    h(
      'button',
      {
        type: 'button',
        className: 'inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-[var(--color-text)]',
        onClick: onToggle,
        'aria-expanded': open,
        'aria-controls': 'today-recommendation-discussion',
        'data-testid': 'recommendation-discussion-toggle',
      },
      h(MessageCircle, { className: 'h-4 w-4', 'aria-hidden': true }),
      t('discussWithAi'),
    ),
    open
      ? h(
        'div',
        {
          id: 'today-recommendation-discussion',
          className: 'mt-4 space-y-4 border-t border-blue-100 pt-4',
          'data-testid': 'today-recommendation-discussion',
        },
        h(
          'div',
          { className: 'flex items-center justify-between gap-3' },
          h('h3', { className: 'text-sm font-semibold text-[var(--color-text)]' }, t('discussWithAi')),
          h(
            Badge,
            { variant: turnsUsed >= turnsLimit ? 'warning' : 'info' },
            t('discussionTurns', { used: turnsUsed, limit: turnsLimit }),
          ),
        ),
        h(
          'div',
          { className: 'space-y-3', 'aria-live': 'polite' },
          messages.length === 0
            ? h('p', { className: 'text-sm text-[var(--color-text-muted)]' }, t('discussionEmpty'))
            : messages.map((message, index) => h(
              'div',
              {
                key: `${message.role}-${index}`,
                className: cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start'),
              },
              h(
                'p',
                {
                  className: cn(
                    'max-w-full rounded-lg px-3 py-2 text-sm leading-relaxed md:max-w-lg',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50/40 text-[var(--color-text)]',
                  ),
                },
                message.content,
              ),
            )),
          sending
            ? h(
              'div',
              { className: 'flex items-center gap-2 text-sm text-[var(--color-text-muted)]' },
              h(Spinner, { size: 'sm' }),
              t('discussionReplying'),
            )
            : null,
        ),
        errorMessage
          ? h(
            'div',
            {
              className: 'rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-sm text-[var(--color-text)]',
              role: 'alert',
            },
            h('p', null, errorMessage),
            error?.kind === 'turns'
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
              onSubmit();
            },
          },
          h('textarea', {
            value: input,
            maxLength: DISCUSSION_CHARACTER_LIMIT + 1,
            rows: 3,
            placeholder: t('discussionInputPlaceholder'),
            onChange: (event: ChangeEvent<HTMLTextAreaElement>) => onInputChange(event.currentTarget.value),
            className: cn(
              'w-full resize-none rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20',
              inputTooLong ? 'bg-blue-50/40' : '',
            ),
            'aria-invalid': inputTooLong,
            'aria-describedby': 'today-recommendation-discussion-count',
          }),
          h(
            'div',
            { className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
            h(
              'span',
              {
                id: 'today-recommendation-discussion-count',
                className: cn('text-xs', inputTooLong ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'),
              },
              t('discussionCharacterCount', { count: input.length, limit: DISCUSSION_CHARACTER_LIMIT }),
            ),
            h(
              Button,
              {
                type: 'submit',
                size: 'sm',
                icon: h(Send, { className: 'h-4 w-4', 'aria-hidden': true }),
                loading: sending,
                disabled: input.trim().length === 0 || inputTooLong || sending,
              },
              t('sendDiscussion'),
            ),
          ),
        ),
      )
      : null,
  );
}
