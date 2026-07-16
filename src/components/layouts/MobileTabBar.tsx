'use client';

import { useEffect, useRef, useState, type ElementType, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { BookOpenText, Gauge, HelpCircle, LibraryBig, Map, MoreHorizontal, ReceiptText, Settings, Sparkles, UsersRound } from 'lucide-react';
import { useOptionalWorkspaceContext } from '@/modules/workspace/WorkspaceProvider';
import {
  getMemberNavigationLabel,
  isMemberNavigationActive,
  MEMBER_MOBILE_PRIMARY_IDS,
  MEMBER_MORE_NAVIGATION,
  MEMBER_PRIMARY_NAVIGATION,
  type MemberNavigationId,
  type MemberNavigationItem,
} from '@/config/canonical-routes';
import { cn } from '@/lib/cn';

type MobileTabBarProps = {
  activationMode?: boolean;
  className?: string;
};

const ICONS: Record<MemberNavigationId, ElementType> = {
  today: Gauge,
  journey: Map,
  brand: Sparkles,
  content: BookOpenText,
  growth: LibraryBig,
  relationships: UsersRound,
  team: UsersRound,
  settings: Settings,
  billing: ReceiptText,
  help: HelpCircle,
};

const mobileItems = MEMBER_MOBILE_PRIMARY_IDS.map(
  (id) => MEMBER_PRIMARY_NAVIGATION.find((item) => item.id === id) as MemberNavigationItem,
);

export function MobileTabBar({ activationMode = false, className }: MobileTabBarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const workspace = useOptionalWorkspaceContext();
  const workspaceMode = workspace?.workspaceContext.activeWorkspaceType;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  void activationMode;

  useEffect(() => {
    if (!moreOpen) return;
    const panel = morePanelRef.current;
    panel?.querySelector<HTMLElement>('a')?.focus();

    function onPointerDown(event: MouseEvent) {
      if (panel?.contains(event.target as Node) || moreButtonRef.current?.contains(event.target as Node)) return;
      setMoreOpen(false);
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMoreOpen(false);
      moreButtonRef.current?.focus();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [moreOpen]);

  function trapMoreFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const focusable = [...(morePanelRef.current?.querySelectorAll<HTMLElement>('a') ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const moreActive = MEMBER_MORE_NAVIGATION.some((item) => isMemberNavigationActive(pathname, item.href));

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" aria-hidden="true" />
      ) : null}
      {moreOpen ? (
        <div
          id="member-more-navigation"
          ref={morePanelRef}
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
          onKeyDown={trapMoreFocus}
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 grid max-h-[min(70vh,28rem)] grid-cols-2 gap-2 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-lg)] lg:hidden"
        >
          {MEMBER_MORE_NAVIGATION.map((item) => {
            const Icon = ICONS[item.id];
            const active = isMemberNavigationActive(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold',
                  active ? 'bg-blue-50 text-[var(--color-primary)]' : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {getMemberNavigationLabel(item, locale, workspaceMode)}
              </Link>
            );
          })}
        </div>
      ) : null}
      <nav
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--color-border)] bg-white px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)]',
          className,
        )}
      >
        {mobileItems.map((item) => {
          const Icon = ICONS[item.id];
          const active = isMemberNavigationActive(pathname, item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 text-xs font-medium',
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate">{getMemberNavigationLabel(item, locale, workspaceMode)}</span>
            </Link>
          );
        })}
        <button
          ref={moreButtonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-controls="member-more-navigation"
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 text-xs font-medium',
            moreOpen || moreActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
          )}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          <span>{locale.startsWith('zh') ? '更多' : locale.startsWith('ms') ? 'Lagi' : 'More'}</span>
        </button>
      </nav>
    </>
  );
}
