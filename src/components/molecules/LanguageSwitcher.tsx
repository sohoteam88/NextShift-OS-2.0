'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { locales, type Locale } from '@/i18n/config';

type LanguageSwitcherProps = {
  className?: string;
};

const labels: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  ms: 'Bahasa',
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextLocale: string) {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm',
        isPending && 'opacity-70',
        className,
      )}
    >
      <Globe2 className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        className="bg-transparent text-sm outline-none"
        aria-label="Language"
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {labels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
