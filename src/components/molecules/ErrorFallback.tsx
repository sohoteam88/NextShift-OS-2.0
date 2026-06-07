'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslations } from 'next-intl';
import { ErrorBanner } from './ErrorBanner';

type SafeSectionProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function SafeSection({ children, fallback }: SafeSectionProps) {
  const t = useTranslations('errors');

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) =>
        fallback ?? (
          <ErrorBanner
            message={t('sectionLoadFailed')}
            description={t('tryAgainMessage')}
            retryLabel={t('retry')}
            onRetry={resetErrorBoundary}
          />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
