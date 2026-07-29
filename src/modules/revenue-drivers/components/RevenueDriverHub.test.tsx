import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const driverTitles: Record<string, string> = {
  'drivers.whatsapp.title': 'WhatsApp AI Auto Reply',
  'drivers.content.title': 'Content Generator',
  'drivers.video.title': 'Video Generator',
  'drivers.ads.title': 'Ads Generator',
  'drivers.webinar.title': 'Webinar Generator',
  'drivers.leadMagnet.title': 'Lead Magnet Generator',
  'drivers.funnels.title': 'Funnel Generator',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (key === 'priority') return `Priority ${values?.priority}`;
    return driverTitles[key] ?? key;
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

vi.mock('lucide-react', () => ({
  ArrowRight: () => createElement('svg'),
  Clapperboard: () => createElement('svg'),
  FileText: () => createElement('svg'),
  LayoutTemplate: () => createElement('svg'),
  Megaphone: () => createElement('svg'),
  MessageCircle: () => createElement('svg'),
  Sparkles: () => createElement('svg'),
  Target: () => createElement('svg'),
}));

import { RevenueDriverHub } from './RevenueDriverHub';

describe('RevenueDriverHub user growth surface', () => {
  it('renders only the four user-facing growth generators', () => {
    const html = renderToStaticMarkup(createElement(RevenueDriverHub));

    expect(html).toContain('WhatsApp AI Auto Reply');
    expect(html).toContain('Content Generator');
    expect(html).toContain('Video Generator');
    expect(html).toContain('Ads Generator');
    expect(html).not.toContain('Webinar Generator');
    expect(html).not.toContain('Lead Magnet Generator');
    expect(html).not.toContain('Funnel Generator');
  });
});
