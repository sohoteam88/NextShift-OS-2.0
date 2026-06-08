import { Badge } from '@/components/ui/Badge';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { getScoreCategory } from '@/modules/crm/services/scoring-service';

const variantMap = { hot: 'success', warm: 'warning', cold: 'default' } as const;
const labelMap = { hot: 'Hot', warm: 'Warm', cold: 'Cold' } as const;

type Props = { score: number; className?: string; helpText?: string };

export function ScoreBadge({ score, className, helpText }: Props) {
  const category = getScoreCategory(score);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={variantMap[category]} className={className} title={labelMap[category]}>
        {score} · {labelMap[category]}
      </Badge>
      {helpText && <HelpTooltip text={helpText} />}
    </span>
  );
}
