'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

type BrandDnaStaleBannerProps = {
  onRegenerate: () => void;
  isPending?: boolean;
};

export function BrandDnaStaleBanner({
  onRegenerate,
  isPending = false,
}: BrandDnaStaleBannerProps) {
  const t = useTranslations('dashboard.staleArtifact');

  return (
    <section
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-amber-950">{t('title')}</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            {t('description')}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={isPending}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        {isPending ? t('regenerating') : t('regenerate')}
      </button>
    </section>
  );
}
