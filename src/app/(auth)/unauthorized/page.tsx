import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';

export default async function UnauthorizedPage() {
  const t = await getTranslations('errors');

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">{t('forbiddenTitle')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('forbiddenMessage')}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
}
