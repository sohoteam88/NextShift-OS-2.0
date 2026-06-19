import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

type RecentWinsCardProps = {
  wins: string[];
  missionRoute: string;
};

export function RecentWinsCard({ wins, missionRoute }: RecentWinsCardProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-emerald-600" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">最近成果</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {wins.length > 0 ? wins.map((win) => (
          <div key={win} className="flex gap-3 rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-950">{win}</p>
          </div>
        )) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm text-[var(--color-text-muted)]">完成今天的任务后，成果会出现在这里。</p>
            <Link href={missionRoute} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
              去执行任务 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
