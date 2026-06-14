'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';

function escapeHtml(input: string) {
  // Escapes ALL HTML entities before markdown rendering.
  // Only <strong>, <em>, <p>, <li>, <ul>, <div> are added back by renderMarkdown().
  // No raw user/AI input ever reaches dangerouslySetInnerHTML.
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderMarkdown(input: string) {
  const escaped = escapeHtml(input);
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const withItalic = withBold.replace(/(^|[\s>])\*(.+?)\*(?=[\s<]|$)/g, '$1<em>$2</em>');
  const lines = withItalic.split('\n');
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = /^[-*•]\s+(.+)$/.exec(trimmed);

    if (listMatch) {
      if (!inList) {
        html.push('<ul class="ml-5 list-disc space-y-1">');
        inList = true;
      }
      html.push(`<li>${listMatch[1]}</li>`);
      continue;
    }

    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    if (!trimmed) {
      html.push('<div class="h-3"></div>');
    } else {
      html.push(`<p>${trimmed}</p>`);
    }
  }

  if (inList) html.push('</ul>');
  return html.join('');
}

type Props = {
  text: string;
  streaming?: boolean;
  className?: string;
};

export function StreamingText({ text, streaming = false, className }: Props) {
  const html = useMemo(() => renderMarkdown(text), [text]);

  return (
    <div className={cn('whitespace-normal break-words text-sm leading-7 text-[var(--color-text)]', className)}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {streaming && <span className="inline-block w-2 animate-pulse align-baseline">|</span>}
    </div>
  );
}
