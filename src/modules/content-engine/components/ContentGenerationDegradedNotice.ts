import { createElement } from 'react';
import { RefreshCw } from 'lucide-react';

export function ContentGenerationDegradedNotice({
  label,
  onRetry,
}: {
  label: string | null;
  onRetry: () => void;
}) {
  if (!label) return null;

  return createElement(
    'div',
    {
      className:
        'rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900',
      role: 'alert',
    },
    createElement('p', { className: 'font-semibold' }, label),
    createElement(
      'button',
      {
        type: 'button',
        onClick: onRetry,
        className:
          'mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-800 hover:text-amber-900',
      },
      createElement(RefreshCw, { className: 'h-3.5 w-3.5', 'aria-hidden': true }),
      '点此重试',
    ),
  );
}
