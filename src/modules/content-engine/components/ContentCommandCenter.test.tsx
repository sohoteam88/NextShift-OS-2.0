import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ContentGenerationDegradedNotice } from './ContentGenerationDegradedNotice';

describe('ContentGenerationDegradedNotice', () => {
  it('renders the returned degradation label and a retry entry', () => {
    const html = renderToStaticMarkup(
      createElement(ContentGenerationDegradedNotice, {
        label: 'AI 暂时不可用，这是基础版本',
        onRetry: vi.fn(),
      }),
    );

    expect(html).toContain('AI 暂时不可用，这是基础版本');
    expect(html).toContain('点此重试');
  });

  it('renders nothing when the generation was not degraded', () => {
    const html = renderToStaticMarkup(
      createElement(ContentGenerationDegradedNotice, {
        label: null,
        onRetry: vi.fn(),
      }),
    );

    expect(html).toBe('');
  });
});
