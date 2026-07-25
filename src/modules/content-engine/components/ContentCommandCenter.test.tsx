import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ContentGenerationDegradedNotice } from './ContentGenerationDegradedNotice';

const commandCenterSource = readFileSync(
  new URL('./ContentCommandCenter.tsx', import.meta.url),
  'utf8',
);

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

describe('ContentCommandCenter Brand DNA quality states', () => {
  it('keeps the generation surface inline for an incomplete profile', () => {
    expect(commandCenterSource).toContain('资料越全，成品越像你。');
    expect(commandCenterSource).toContain('现在就能生成内容；补充后会更贴合你。');
    expect(commandCenterSource).toContain('生成内容计划');
    expect(commandCenterSource).toContain('生成贴文');
    expect(commandCenterSource).toContain('<BrandDnaQualityNotice');
    expect(commandCenterSource).not.toContain('BrandDNAGate');
    expect(commandCenterSource).not.toContain('Brand DNA 还不完整。');
    expect(commandCenterSource).not.toContain('返回确认 Brand DNA');
  });

  it('only shows the quality notice for an incomplete or failed profile', () => {
    expect(commandCenterSource).toContain(
      'brandProfileQuery.isError || !hasBrandDNA(profile)',
    );
    expect(commandCenterSource).not.toContain(
      'if (brandProfileQuery.isError || !hasBrandDNA(profile))',
    );
  });

  it('offers a retry rather than a Brand DNA redirect when the profile load fails', () => {
    expect(commandCenterSource).toContain('Brand DNA 暂时无法读取。');
    expect(commandCenterSource).toContain('重试读取资料');
    expect(commandCenterSource).toContain('void brandProfileQuery.refetch()');
  });
});
