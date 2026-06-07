'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MessageCircleMore, CircleHelp } from 'lucide-react';

const sections = [
  { titleKey: 'gettingStarted', items: [['q1', 'a1'], ['q2', 'a2'], ['q3', 'a3']] as const },
  { titleKey: 'dailyUse', items: [['q4', 'a4'], ['q5', 'a5']] as const },
  { titleKey: 'teamManagement', items: [['q6', 'a6'], ['q7', 'a7']] as const },
  { titleKey: 'account', items: [['q8', 'a8'], ['q9', 'a9']] as const },
];

export default function HelpPage() {
  const t = useTranslations('help');

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-primary)]">
          <CircleHelp className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('intro')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.titleKey} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t(section.titleKey)}</h2>
            <div className="mt-4 space-y-3">
              {section.items.map(([questionKey, answerKey]) => (
                <details key={questionKey} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--color-text)]">
                    {t(questionKey)}
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    {t(answerKey)}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('contactSupport')}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('whatsappSupport')}</p>
        <Link
          href="https://wa.me/60123456789"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <MessageCircleMore className="h-4 w-4" />
          {t('whatsappSupport')}
        </Link>
      </section>
    </div>
  );
}
