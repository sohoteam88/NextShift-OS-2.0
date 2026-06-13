// ============================================================
// Social Setup Advisor
// Deterministic recommendations — no paid AI API calls.
// ============================================================

import type { SocialReadinessResult } from './types';

export interface SocialAdvisorTip {
  id: string;
  priority: number;
  title: string;
  body: string;
  action: string;
}

export function getSocialAdvisorTips(result: SocialReadinessResult): SocialAdvisorTip[] {
  const tips: SocialAdvisorTip[] = [];

  if (result.facebookCompleteness < 70) {
    tips.push({
      id: 'fix_facebook',
      priority: 1,
      title: '完善 Facebook 主页',
      body: 'FB Page 是很多潜在客户第一个会搜到你的地方。确保名称、简介和 CTA 按钮设置正确。',
      action: '完善 Facebook 主页设置',
    });
  }

  if (result.instagramCompleteness < 70) {
    tips.push({
      id: 'fix_instagram',
      priority: 2,
      title: '完善 Instagram 个人资料',
      body: 'IG BIO 是你在 3 秒内吸引关注者的关键。用四行结构：你帮谁 → 转变 → 证明 → CTA。',
      action: '完善 Instagram BIO 设置',
    });
  }

  if (result.bioClarity < 60) {
    tips.push({
      id: 'improve_bio',
      priority: 3,
      title: '优化你的 BIO',
      body: '好的 BIO 让人一看就知道你是谁、帮谁、为什么要关注你。使用清晰的 CTA 引导行动。',
      action: '重写 BIO 使其更清晰',
    });
  }

  if (result.ctaClarity < 60) {
    tips.push({
      id: 'set_cta',
      priority: 4,
      title: '设置明确的行动按钮',
      body: '没有 CTA 的页面等于白做。根据你的服务类型选择最合适的按钮：WhatsApp 咨询、预约、或了解更多。',
      action: '选择和设置 CTA 按钮',
    });
  }

  if (result.visualConsistency < 50) {
    tips.push({
      id: 'fix_visual',
      priority: 5,
      title: '准备视觉素材',
      body: '头像和封面是账号的第一印象。先准备好方向提示词，再找设计师或用 AI 工具生成。',
      action: '设置头像和封面方向',
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: 'all_set',
      priority: 99,
      title: '社交媒体设置已完成',
      body: '你的社交资料已经准备好了。现在可以复制去使用，或者继续下一步创建内容。',
      action: '开始内容创建',
    });
  }

  return tips.sort((a, b) => a.priority - b.priority);
}
