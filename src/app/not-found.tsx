import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SearchX } from 'lucide-react';

export default async function NotFound() {
  const t = await getTranslations('errors');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm">
          <SearchX className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('pageNotFound')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('pageNotFoundMessage')}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
}
