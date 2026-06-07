import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Clock3 } from 'lucide-react';

export default async function PendingPage() {
  const t = await getTranslations('auth');
  const help = await getTranslations('errors');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm">
          <Clock3 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">{t('pendingApproval')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{help('tryAgainMessage')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </main>
  );
}
