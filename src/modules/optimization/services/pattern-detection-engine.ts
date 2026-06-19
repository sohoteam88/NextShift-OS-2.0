import type { OptimizationPattern, RecommendedSystemChange } from '../contracts/OptimizationProjection';

export function recommendedChangesFromPatterns(input: {
  wins: OptimizationPattern[];
  failures: OptimizationPattern[];
}): RecommendedSystemChange[] {
  const changes: RecommendedSystemChange[] = [];

  for (const win of input.wins.slice(0, 2)) {
    changes.push({
      area: win.area,
      title: `Increase usage of ${win.title}`,
      reason: win.reason,
      priority: win.confidenceDelta >= 10 ? 'high' : 'medium',
    });
  }

  for (const failure of input.failures.slice(0, 3)) {
    changes.push({
      area: failure.area,
      title: `Reduce friction from ${failure.title}`,
      reason: failure.reason,
      priority: Math.abs(failure.confidenceDelta) >= 10 ? 'high' : 'medium',
    });
  }

  return changes;
}
