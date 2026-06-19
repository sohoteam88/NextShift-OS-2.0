import { getBrandHealthSnapshot } from './brand-health-projection';
import type {
  BrandAdvisorAction,
  BrandAdvisorRecommendation,
  BrandAdvisorSnapshot,
  BrandHealthSnapshot,
} from '../types/brand-intelligence';

type AdvisorCategory = BrandAdvisorRecommendation['category'];

type HealthCategory = keyof BrandHealthSnapshot['categoryScores'];

const CATEGORY_LABELS: Record<HealthCategory, string> = {
  identity: '身份',
  audience: '受众',
  messaging: '信息',
  content: '内容',
  offer: '服务',
  visual: '视觉',
};

const ADVISOR_COPY: Record<
  HealthCategory,
  {
    title: string;
    description: string;
    action: string;
  }
> = {
  identity: {
    title: '完善你的品牌身份',
    description: '清晰的品牌名称和定位是一切的基础。用户看到你的第一眼应该立刻知道你是谁、做什么的。',
    action: '填写品牌名称和定位陈述',
  },
  audience: {
    title: '明确你的目标受众',
    description: '如果你不知道在对谁说话，内容就会没有方向。定义受众的痛点、目标和顾虑。',
    action: '定义目标受众',
  },
  messaging: {
    title: '打磨你的核心信息',
    description: '一句话说清楚你能帮人解决什么问题。好的核心信息让人一听就记住你。',
    action: '撰写核心信息和电梯演讲',
  },
  content: {
    title: '建立内容支柱',
    description: '至少需要 3 个内容支柱来确保你的内容覆盖不同角度：教育、故事、社会证明、产品、互动。',
    action: '创建至少 3 个内容支柱',
  },
  offer: {
    title: '明确你的服务产品',
    description: '有了清晰的服务产品，你的内容、漏斗、跟进才有方向。定义主要服务和转变承诺。',
    action: '定义服务产品',
  },
  visual: {
    title: '完善视觉方向',
    description: '品牌颜色和视觉方向让你的内容有辨识度。定义主色调和头像/封面方向。',
    action: '设置品牌颜色和视觉方向',
  },
};

function categoryToPriority(score: number): 'high' | 'medium' | 'low' {
  if (score < 40) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

function makeStrengths(health: BrandHealthSnapshot): string[] {
  return (Object.entries(health.categoryScores) as Array<[HealthCategory, number]>)
    .filter(([, score]) => score >= 70)
    .map(([category, score]) => `${CATEGORY_LABELS[category]}表现良好（${score}%）`);
}

function makeWeaknesses(health: BrandHealthSnapshot): string[] {
  return (Object.entries(health.categoryScores) as Array<[HealthCategory, number]>)
    .filter(([, score]) => score < 70)
    .map(([category, score]) => `${CATEGORY_LABELS[category]}需要加强（${score}%）`);
}

function makeRecommendations(health: BrandHealthSnapshot): BrandAdvisorRecommendation[] {
  const ordered: HealthCategory[] = ['identity', 'audience', 'messaging', 'offer', 'content', 'visual'];

  const recs = ordered
    .filter((category) => health.categoryScores[category] < 70)
    .map((category, index) => {
      const copy = ADVISOR_COPY[category];
      return {
        id: `advisor-${category}`,
        title: copy.title,
        description: copy.description,
        priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
        category: category as AdvisorCategory,
      } satisfies BrandAdvisorRecommendation;
    });

  if (recs.length === 0) {
    recs.push({
      id: 'advisor-all-good',
      title: '品牌基础已经很完整了',
      description: '你的品牌健康度已经足够稳定，可以开始把重心转向内容引擎和下一阶段增长。',
      priority: 'low',
      category: 'content',
    });
  }

  return recs;
}

function makePriorityActions(health: BrandHealthSnapshot, recommendations: BrandAdvisorRecommendation[]): BrandAdvisorAction[] {
  if (recommendations.length === 1 && recommendations[0]?.id === 'advisor-all-good') {
    return [
      {
        id: 'action-content-engine',
        label: '开始内容引擎',
        route: '/content-engine',
        priority: 'high',
      },
      {
        id: 'action-intelligence',
        label: '查看品牌洞察',
        route: '/brand-builder/intelligence',
        priority: 'medium',
      },
    ];
  }

  const topCategory = (Object.entries(health.categoryScores) as Array<[HealthCategory, number]>)
    .sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'identity';

  const actions: BrandAdvisorAction[] = [
    {
      id: `action-${topCategory}`,
      label: ADVISOR_COPY[topCategory].action,
      route: '/brand-builder/profile',
      priority: 'high',
    },
    {
      id: 'action-intelligence',
      label: '查看品牌洞察',
      route: '/brand-builder/intelligence',
      priority: 'medium',
    },
  ];

  if (health.categoryScores.content < 70) {
    actions.push({
      id: 'action-content-engine',
      label: '进入内容引擎',
      route: '/content-engine',
      priority: 'low',
    });
  }

  return actions;
}

export async function getBrandAdvisorSnapshot(userId: string): Promise<BrandAdvisorSnapshot> {
  const health = await getBrandHealthSnapshot(userId);
  const recommendations = makeRecommendations(health);

  return {
    strengths: makeStrengths(health),
    weaknesses: makeWeaknesses(health),
    blindSpots: health.missingFields.map((field) => `缺少 ${field}`),
    recommendations,
    priorityActions: makePriorityActions(health, recommendations),
  };
}
