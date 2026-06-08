import { Badge } from '@/components/ui/Badge';

export function scoreVariant(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'default';
}

export function scoreLabel(score: number) {
  if (score >= 70) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
}

export function LeadScoreBadge({ score }: { score: number }) {
  return (
    <Badge variant={scoreVariant(score)}>
      {score} · {scoreLabel(score)}
    </Badge>
  );
}
