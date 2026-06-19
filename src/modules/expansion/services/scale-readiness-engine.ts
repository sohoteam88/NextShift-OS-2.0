import type { ExpansionProjection } from '../contracts/ExpansionProjection';
import type { ExpansionFacts } from './expansion-facts';

function readinessStatus(score: number): ExpansionProjection['scaleReadiness']['status'] {
  if (score >= 80) return 'scale_ready';
  if (score >= 65) return 'strong';
  if (score >= 45) return 'ready';
  return 'not_ready';
}

export function calculateScaleReadiness(facts: ExpansionFacts): ExpansionProjection['scaleReadiness'] {
  const value = facts.valueProjection.valueRealizationScore;
  const retention = facts.retentionProjection.retentionScore;
  const repeatableSignals = Object.values(facts.metrics).filter((metric) => metric.current > 0 && metric.previous > 0).length;
  const score = Math.max(0, Math.min(100, Math.round(value * 0.45 + retention * 0.35 + repeatableSignals * 5)));
  const status = readinessStatus(score);

  return {
    score,
    status,
    reason: status === 'not_ready'
      ? 'Value has been achieved, but the repeatable growth pattern is not strong enough to scale yet.'
      : status === 'ready'
        ? 'There is enough value and retention signal to start multiplying one growth lever.'
        : status === 'strong'
          ? 'Value, retention, and repeatable growth signals are strong enough for focused scaling.'
          : 'The user has clear value and repeatable growth signals. Optimize and scale the working path.',
  };
}
