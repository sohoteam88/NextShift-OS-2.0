'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  ClipboardList,
  FileText,
  Fingerprint,
  LayoutTemplate,
  MessageSquareText,
  RadioTower,
  Sparkles,
  Target,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import {
  EXECUTION_ROADMAP_STEPS,
  getExecutionRoadmapLabel,
  isExecutionRoadmapStepActive,
  type ExecutionRoadmapStepId,
} from '@/modules/mission/constants/execution-roadmap';
import { cn } from '@/lib/cn';

const ICONS: Record<ExecutionRoadmapStepId, LucideIcon> = {
  brand_interview: MessageSquareText,
  brand_dna: Fingerprint,
  ai_coo: BrainCircuit,
  content_engine: FileText,
  lead_magnet: Target,
  funnel_landing_page: LayoutTemplate,
  traffic_test: RadioTower,
  leads: UsersRound,
  crm: ClipboardList,
  sales: BadgeDollarSign,
  workforce: Bot,
};

type ExecutionRoadmapRailProps = {
  className?: string;
};

export function ExecutionRoadmapRail({ className }: ExecutionRoadmapRailProps) {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <section
      className={cn(
        'sticky top-16 z-10 border-b border-[var(--color-border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85',
        className,
      )}
      aria-label="Execution roadmap"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2 lg:px-6">
        <div className="hidden shrink-0 items-center gap-2 text-xs font-bold text-[var(--color-text)] sm:flex">
          <Sparkles className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
          执行路线
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1.5">
            {EXECUTION_ROADMAP_STEPS.map((step) => {
              const Icon = ICONS[step.id];
              const active = isExecutionRoadmapStepActive(step, pathname);

              return (
                <Link
                  key={step.id}
                  href={step.route}
                  aria-current={active ? 'step' : undefined}
                  title={step.outcome_zh}
                  className={cn(
                    'group inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-blue-200 bg-blue-50 text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      active ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {step.order}
                  </span>
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{getExecutionRoadmapLabel(step, locale)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
