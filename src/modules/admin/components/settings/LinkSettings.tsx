'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

type Props = {
  sections: Array<{
    title: string;
    links: Array<{ href: string; label: string }>;
  }>;
};

export function LinkSettings({ sections }: Props) {
  const t = useTranslations('admin');
  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{section.title}</h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 hover:bg-gray-100">{link.label}</Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
