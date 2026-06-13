// ============================================================
// Brand DNA Advisor
// Rule-based recommendations — no paid AI API calls.
// ============================================================

import type { DNAHealthScore } from '../types';

// ============================================================
// Types
// ============================================================

export interface AdvisorRecommendation {
  id: string;
  priority: number;
  section: string;
  title: string;
  body: string;
  action: string;
  route?: string;
}

// ============================================================
// Rule engine
// ============================================================

export function getAdvisorRecommendations(health: DNAHealthScore): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];

  // Identity
  if (health.identityClarity < 70) {
    recs.push({
      id: 'improve_identity',
      priority: 1,
      section: 'identity',
      title: '完善你的品牌身份',
      body: '清晰的品牌名称和定位是一切的基础。用户看到你的第一眼应该立刻知道你是谁、做什么的。',
      action: '填写品牌名称和定位陈述',
      route: '/brand-dna',
    });
  }

  // Audience
  if (health.audienceClarity < 70) {
    recs.push({
      id: 'define_audience',
      priority: 2,
      section: 'audience',
      title: '明确你的目标受众',
      body: '如果你不知道在对谁说话，内容就会没有方向。定义受众的痛点、目标和顾虑。',
      action: '定义目标受众',
      route: '/brand-dna',
    });
  }

  // Messaging
  if (health.messagingClarity < 70) {
    recs.push({
      id: 'craft_messaging',
      priority: 3,
      section: 'messaging',
      title: '打磨你的核心信息',
      body: '一句话说清楚你能帮人解决什么问题。好的核心信息让人一听就记住你。',
      action: '撰写核心信息和电梯演讲',
      route: '/brand-dna',
    });
  }

  // Offer
  if (health.offerClarity < 70) {
    recs.push({
      id: 'define_offer',
      priority: 4,
      section: 'offer',
      title: '明确你的服务产品',
      body: '有了清晰的服务产品，你的内容、漏斗、跟进才有方向。定义主要服务和转变承诺。',
      action: '定义服务产品',
      route: '/brand-dna',
    });
  }

  // Content
  if (health.contentClarity < 70) {
    recs.push({
      id: 'create_pillars',
      priority: 5,
      section: 'content',
      title: '建立内容支柱',
      body: '至少需要 3 个内容支柱来确保你的内容覆盖不同角度：教育、故事、社会证明、产品、互动。',
      action: '创建至少 3 个内容支柱',
      route: '/brand-dna',
    });
  }

  // Visual
  if (health.visualClarity < 70) {
    recs.push({
      id: 'setup_visual',
      priority: 6,
      section: 'visual',
      title: '完善视觉方向',
      body: '品牌颜色和视觉方向让你的内容有辨识度。定义主色调和头像/封面方向。',
      action: '设置品牌颜色和视觉方向',
      route: '/brand-dna',
    });
  }

  // Everything good
  if (recs.length === 0) {
    recs.push({
      id: 'all_good',
      priority: 99,
      section: 'overall',
      title: '品牌 DNA 已经很完整了',
      body: '你的品牌基础非常扎实。可以开始使用 Content Engine、Video Engine 等工具了。',
      action: '开始内容引擎',
      route: '/ai',
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
