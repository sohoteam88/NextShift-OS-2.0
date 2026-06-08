'use client';

import { useLocale } from 'next-intl';
import { useToast } from '@/stores/toast-store';
import { getLocalizedErrorMessage } from '@/lib/errors';
import type { Locale } from '@/i18n/config';

type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return Boolean(value && typeof value === 'object' && ('code' in value || 'message' in value));
}

function normalizeLocale(locale: string): Locale {
  return locale === 'zh' || locale === 'en' || locale === 'ms' ? locale : 'zh';
}

export function useApiError() {
  const locale = normalizeLocale(useLocale());
  const { toast } = useToast();

  function handleError(error: unknown, fallbackCode = 'INTERNAL_ERROR') {
    const payload = isApiErrorPayload(error) ? error : null;
    const code = payload?.code ?? fallbackCode;
    const message = getLocalizedErrorMessage(code, locale, payload?.message);
    toast('error', message);
    return message;
  }

  return { handleError };
}
