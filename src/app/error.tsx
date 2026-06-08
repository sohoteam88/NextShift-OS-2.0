'use client';

import { useLocale, useTranslations } from 'next-intl';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors');
  const locale = useLocale();

  return (
    <html lang={locale}>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
          <div className="max-w-md text-center">
            <div className="mb-4 text-6xl">😵</div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">{t('somethingWentWrong')}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('tryAgainMessage')}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t('tryAgain')}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
