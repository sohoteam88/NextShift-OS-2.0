// Benchmark Service — compares content performance across dimensions

import type { BenchmarkComparison, BenchmarkGroup, ContentPerformance } from '../types/performance.types';

function avg(values: number[]): number {
  return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export function benchmarkByPillar(items: ContentPerformance[]): BenchmarkComparison {
  const groups = groupBy(items, i => i.pillar);
  const groupList: BenchmarkGroup[] = [];
  for (const [label, groupItems] of groups) {
    groupList.push({
      label,
      avgReach: avg(groupItems.map(i => i.kpis.views)),
      avgEngagement: avg(groupItems.map(i => i.kpis.likes + i.kpis.comments)),
      avgLeads: avg(groupItems.map(i => i.kpis.leads)),
      avgPerformance: avg(groupItems.map(i => i.performanceScore)),
      count: groupItems.length,
    });
  }
  groupList.sort((a, b) => b.avgPerformance - a.avgPerformance);
  return { category: 'pillar', groups: groupList };
}

export function benchmarkByPlatform(items: ContentPerformance[]): BenchmarkComparison {
  const groups = groupBy(items, i => i.platform);
  const groupList: BenchmarkGroup[] = [];
  for (const [label, groupItems] of groups) {
    groupList.push({
      label,
      avgReach: avg(groupItems.map(i => i.kpis.views)),
      avgEngagement: avg(groupItems.map(i => i.kpis.likes + i.kpis.comments)),
      avgLeads: avg(groupItems.map(i => i.kpis.leads)),
      avgPerformance: avg(groupItems.map(i => i.performanceScore)),
      count: groupItems.length,
    });
  }
  groupList.sort((a, b) => b.avgPerformance - a.avgPerformance);
  return { category: 'platform', groups: groupList };
}
