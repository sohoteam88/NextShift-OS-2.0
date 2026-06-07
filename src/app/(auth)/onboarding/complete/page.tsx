import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { onboardingService } from '@/modules/member/services/onboarding-service';

export default async function OnboardingCompletePage() {
  const t = await getTranslations('onboarding');
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  const overview = await onboardingService.getOverview(user.id);
  if (!overview.state.completed) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          {t('completeStep')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{t('completionTitle')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          {t('completionDescription')}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
          >
            {t('goDashboard')}
          </Link>
          {overview.first_funnel_id ? (
            <Link
              href={`/funnel/${overview.first_funnel_id}/edit`}
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
            >
              {t('openFunnel')}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-[var(--color-text-muted)]">{t('profileTitle')}</p>
          <p className="mt-2 text-base font-medium text-[var(--color-text)]">{overview.user.name}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-[var(--color-text-muted)]">{t('brandTitle')}</p>
          <p className="mt-2 text-base font-medium text-[var(--color-text)]">
            {overview.brand_positioning?.positioning ?? '—'}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-[var(--color-text-muted)]">{t('firstContentTitle')}</p>
          <p className="mt-2 text-base font-medium text-[var(--color-text)]">
            {overview.first_content_options[0]?.title ?? '—'}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-[var(--color-text-muted)]">{t('firstFunnelTitle')}</p>
          <p className="mt-2 text-base font-medium text-[var(--color-text)]">
            {overview.first_funnel_id ? t('funnelCreated') : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
