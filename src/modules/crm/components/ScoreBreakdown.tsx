import { type ScoringReason, getScoreCategory } from '@/modules/crm/services/scoring-service';

const categoryLabel = { hot: 'Hot 🟢', warm: 'Warm 🟡', cold: 'Cold ⚪' };

type Props = {
  score: number;
  reasons: ScoringReason[];
};

export function ScoreBreakdown({ score, reasons }: Props) {
  const category = getScoreCategory(score);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">评分明细</h3>
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {score}/100 · {categoryLabel[category]}
        </span>
      </div>

      {reasons.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">暂无评分数据</p>
      ) : (
        <ul className="space-y-1.5">
          {reasons.map((r) => (
            <li key={r.signal} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <span>{r.points >= 0 ? '✅' : '❌'}</span>
                {r.description}
              </span>
              <span
                className={
                  r.points >= 0
                    ? 'font-medium text-emerald-600'
                    : 'font-medium text-[var(--color-danger)]'
                }
              >
                {r.points >= 0 ? `+${r.points}` : r.points}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-2 text-sm font-semibold">
        <span>总分</span>
        <span>{score}</span>
      </div>
    </div>
  );
}
