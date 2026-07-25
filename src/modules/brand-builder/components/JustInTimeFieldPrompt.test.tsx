import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JustInTimeFieldPrompt, saveJustInTimeField, skipJustInTimeField } from './JustInTimeFieldPrompt';

describe('JustInTimeFieldPrompt', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders a skip action so the current flow is not blocked', () => {
    const html = renderToStaticMarkup(createElement(JustInTimeFieldPrompt, {
      field: 'phone',
      label: '留下 WhatsApp 号码？',
      whyNow: '引流 CTA 会用到它。',
      placeholder: '60123456789',
    }));

    expect(html).toContain('暂时跳过');
    expect(html).toContain('保存并继续');
  });

  it('continues after skip without sending a profile update', () => {
    const onSkipped = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    skipJustInTimeField(onSkipped);

    expect(onSkipped).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PATCHes only the submitted field through the existing profile endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { phone: '60123456789' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await saveJustInTimeField('phone', ' 60123456789 ');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '60123456789' }),
    });
  });
});
