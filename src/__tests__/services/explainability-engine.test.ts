import { describe, expect, it } from 'vitest';
import { resolveExplainability } from '@/modules/mission-engine/services/ExplainabilityEngine';
import type { BottleneckResult, MissionBottleneck, PriorityResult } from '@/modules/mission-engine/contracts/MissionAuthority';

function bottleneckResult(bottleneck: MissionBottleneck, overrides: Partial<BottleneckResult> = {}): BottleneckResult {
  return {
    bottleneck,
    confidence: 80,
    evidence: ['trafficCount=153', 'leadCount=42'],
    severity: 'High',
    explainability: `Resolved ${bottleneck}.`,
    ...overrides,
  };
}

function priorityResult(overrides: Partial<PriorityResult> = {}): PriorityResult {
  return {
    priorityAction: 'Activate Traffic Source',
    priorityReason: 'Your funnel and lead magnet are ready. Without traffic, no new leads can enter the system.',
    expectedImpact: 'A traffic source creates the fastest path to new leads and growth feedback.',
    urgency: 'High',
    confidence: 82,
    category: 'LEADS',
    missionType: 'TRAFFIC',
    route: '/traffic-engine',
    ctaLabel: '启动流量测试',
    ...overrides,
  };
}

function combinedText(result: ReturnType<typeof resolveExplainability>) {
  return [
    result.whyThis,
    result.whyNow,
    result.whyNotOthers,
    result.expectedOutcome,
    result.expectedRisk,
    result.nextMilestone,
  ].join(' ');
}

describe('COO-004 Explainability Engine', () => {
  it('returns English explanation components by default', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_TRAFFIC'),
      priorityResult: priorityResult(),
    });

    expect(result).toMatchObject({
      whyThis: expect.stringContaining('funnel and lead capture system'),
      whyNow: expect.stringContaining('Without traffic'),
      whyNotOthers: expect.stringContaining('Content optimization'),
      expectedOutcome: 'Generate your first leads.',
      expectedRisk: expect.stringContaining('growth may stall'),
      nextMilestone: 'Acquire your first customer',
      locale: 'en',
      source: 'ExplainabilityEngine',
    });
  });

  it('returns Chinese explanation components when locale is zh', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_TRAFFIC'),
      priorityResult: priorityResult(),
      locale: 'zh',
    });

    expect(result).toMatchObject({
      whyThis: '你的漏斗和潜在客户收集系统已经建立完成。目前最大的限制是没有流量进入系统。',
      whyNow: '如果没有流量，所有后续增长活动都会受到限制。',
      whyNotOthers: '优化内容是有价值的。但目前流量获取比内容优化更能推动业务成长。',
      expectedOutcome: '获得第一批潜在客户。',
      expectedRisk: '如果持续没有流量，业务增长将停滞。',
      nextMilestone: '获得第一位客户',
      locale: 'zh',
      source: 'ExplainabilityEngine',
    });
  });

  it('returns Malay explanation components when locale is ms', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_TRAFFIC'),
      priorityResult: priorityResult(),
      locale: 'ms',
    });

    expect(result).toMatchObject({
      whyThis: 'Sistem funnel dan pengumpulan prospek anda telah siap. Namun tiada trafik aktif memasuki perniagaan anda.',
      whyNow: 'Tanpa trafik, semua aktiviti pertumbuhan seterusnya menjadi kurang berkesan.',
      whyNotOthers: 'Penambahbaikan kandungan adalah penting. Tetapi pemerolehan trafik memberi impak yang lebih besar pada tahap ini.',
      expectedOutcome: 'Menjana prospek pertama.',
      expectedRisk: 'Pertumbuhan perniagaan mungkin terhenti jika trafik tidak diwujudkan.',
      nextMilestone: 'Mendapat pelanggan pertama',
      locale: 'ms',
      source: 'ExplainabilityEngine',
    });
  });

  it('falls back to English for unsupported locales', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_TRAFFIC'),
      priorityResult: priorityResult(),
      locale: 'jp',
    });

    expect(result).toMatchObject({
      whyThis: expect.stringContaining('funnel and lead capture system'),
      expectedOutcome: 'Generate your first leads.',
      locale: 'en',
      source: 'ExplainabilityEngine',
    });
  });

  it('uses the centralized ExplainabilityEngine fallback when a template is unavailable', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_TRAFFIC', {
        bottleneck: 'UNKNOWN_BOTTLENECK' as MissionBottleneck,
      }),
      priorityResult: priorityResult(),
    });

    expect(result).toMatchObject({
      whyThis: 'Explanation temporarily unavailable.',
      whyNow: 'Business context is being refreshed.',
      whyNotOthers: 'Alternative analysis unavailable.',
      expectedOutcome: 'Restore recommendation visibility.',
      expectedRisk: 'Reduced decision transparency.',
      nextMilestone: 'Explainability Recovery',
      locale: 'en',
      source: 'ExplainabilityEngine',
    });
  });

  it('uses healthy business copy without repair language', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('BUSINESS_HEALTHY', { severity: 'None', confidence: 90 }),
      priorityResult: priorityResult({
        priorityAction: 'Optimize Growth',
        expectedImpact: 'The business keeps momentum while testing growth, revenue, or scale opportunities.',
        urgency: 'Normal',
        category: 'OPTIMIZATION',
        missionType: 'OPTIMIZATION',
        route: '/dashboard',
        ctaLabel: '继续优化系统',
      }),
    });

    expect(result).toMatchObject({
      whyThis: 'Your business currently has no critical bottlenecks.',
      whyNow: 'Optimization opportunities produce the highest leverage improvements.',
      whyNotOthers: 'No repair actions are required at this stage.',
      expectedOutcome: 'Increase business performance.',
      expectedRisk: 'Growth may slow if optimization opportunities are ignored.',
      nextMilestone: 'Scale Operations',
      source: 'ExplainabilityEngine',
    });
  });

  it('uses signal recovery copy for NO_SYSTEM', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_SYSTEM'),
      priorityResult: priorityResult({
        priorityAction: 'Restore Business Signals',
        expectedImpact: 'The AI COO can resume trustworthy bottleneck and mission decisions.',
        category: 'SYSTEM',
        missionType: 'OPTIMIZATION',
        route: '/dashboard',
        ctaLabel: '恢复业务信号',
      }),
    });

    expect(result).toMatchObject({
      whyThis: 'Business signals are unavailable.',
      whyNow: 'Reliable recommendations cannot be generated until signal visibility is restored.',
      whyNotOthers: 'Any business recommendation would be speculative without valid signals.',
      expectedOutcome: 'Restore accurate business visibility.',
      expectedRisk: 'Incorrect decisions may be made if important business information is missing.',
      nextMilestone: 'Signal Recovery',
      source: 'ExplainabilityEngine',
    });
  });

  it('does not expose internal scores, raw signals, or implementation details', () => {
    const result = resolveExplainability({
      bottleneckResult: bottleneckResult('NO_TRAFFIC'),
      priorityResult: priorityResult(),
    });

    expect(combinedText(result)).not.toMatch(/confidence|candidate score|priority score|severity weight/i);
    expect(combinedText(result)).not.toMatch(/trafficCount=|leadCount=/);
    expect(combinedText(result)).not.toMatch(/Bottleneck Engine|Priority Engine|Validation Layer/i);
  });
});
