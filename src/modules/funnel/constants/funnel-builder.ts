import type { FunnelBuilderInput } from '@/modules/ai/services/funnel-builder-service';
import type { CaseStudy, StrategyContext } from '@/modules/funnel/types/strategy-context';
import type { RealMaterialForm } from '../types/funnel-builder';

// ─── Label maps ───────────────────────────────────────────────────────────────

export const avatarLabels: Record<string, string> = {
  name: '客户名字', ageRange: '年龄层', gender: '性别', location: '地区',
  currentSituation: '当前状况', mainPain: '主要痛点', hiddenFear: '隐藏恐惧',
  desiredOutcome: '期望结果', biggestObjection: '最大异议', buyingTrigger: '购买触发点',
  emotionalHook: '情感钩子', logicalHook: '逻辑钩子', bestPlatform: '最佳平台', bestCta: '最佳CTA',
};

export const painLabels: Record<string, string> = {
  surfacePain: '表面痛点', deepPain: '深层痛点', dailyFrustration: '每日挫败感',
  emotionalCost: '情感代价', financialCost: '财务代价', socialCost: '社交代价',
  dreamOutcome: '梦想结果', fastWin: '快速胜利', longTermTransformation: '长期转变',
};

export const benchmarkLabels: Record<string, string> = {
  optInRate: '落地页转化率', whatsappClickRate: 'WA点击率',
  replyRate: '回复率', appointmentRate: '预约率', closeRate: '成交率',
};

export const gradeColors: Record<string, string> = {
  a: 'bg-green-100 text-green-700',
  b: 'bg-blue-100 text-blue-700',
  c: 'bg-yellow-100 text-yellow-700',
  d: 'bg-red-100 text-red-700',
};

// ─── Form fields config ───────────────────────────────────────────────────────

export const CLOSING_OPTIONS = ['WhatsApp', 'Zoom Call', 'Direct Purchase', 'Webinar', 'Telegram'];
export const TRAFFIC_OPTIONS = ['Facebook Ads', 'TikTok Ads', 'TikTok Organic', 'Instagram', 'Referral', 'Google Ads', 'WhatsApp Blast'];
export const TONE_OPTIONS = ['Warm & Relatable', 'Professional', 'Casual', 'Motivational', 'Educational'];
export const LANGUAGE_OPTIONS = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: 'Bahasa Malaysia', value: 'ms' },
];

export const OUTPUT_ITEMS = [
  '落地页完整文案',
  'WhatsApp 欢迎与跟进脚本',
  '5 个引流资源方案',
  '5 封邮件序列',
  '10 个广告角度',
  '20 个短视频开头',
  '异议处理与数据追踪清单',
];

export const STRATEGY_STEPS = [
  ['1', '先定义客户画像与痛点'],
  ['2', '再定位 offer 与 lead magnet'],
  ['3', '最后生成成交与跟进系统'],
] as const;

export const RESULT_SUMMARY_CARDS = [
  ['类型', 'funnelSummary.funnelType'],
  ['目标', 'funnelSummary.primaryGoal'],
  ['成交', 'funnelSummary.closingChannel'],
  ['引流资源', 'landingPage.leadMagnet.name'],
] as const;

// ─── Helper functions ─────────────────────────────────────────────────────────

export function normalizeRealMaterial(material: RealMaterialForm): StrategyContext['real_material'] {
  return {
    founder_story: material.founder_story.trim() || undefined,
    case_studies: material.case_studies
      .map((item) => ({
        name: item.name.trim(),
        before_state: item.before_state.trim(),
        process: item.process.trim(),
        after_result: item.after_result.trim(),
      }))
      .filter((item) => item.name && item.before_state && item.process && item.after_result),
    common_objections: material.common_objections.map((item) => item.trim()).filter(Boolean),
    competitors_mentioned: material.competitors_mentioned.trim() || undefined,
  };
}

export function buildExampleMaterial(form: FunnelBuilderInput): RealMaterialForm {
  return {
    founder_story: `示例 - 建议替换为真实经历：我以前也面对「${form.mainCustomerPain || '不知道从哪里开始'}」，后来把过程拆成更小的步骤，才发现改变不需要一次做很多。`,
    case_studies: [{
      name: '示例小美',
      before_state: form.mainCustomerPain || '每个月都想增加收入，但不知道该从哪里开始',
      process: `用 ${form.productOrService || '这套系统'} 先完成诊断，再用 2-3 周执行一个小行动`,
      after_result: form.desiredResult || '开始看到清楚方向，并愿意进入下一步咨询',
    }],
    common_objections: [
      '示例 - 我不懂技术，怎么开始？',
      '示例 - 这会不会很难坚持？',
      '示例 - 我之前试过类似的但失败了',
    ],
    competitors_mentioned: '示例 - 其他副业课程 / 自己摸索',
  };
}

// ─── Case study field config ──────────────────────────────────────────────────

export const CASE_STUDY_FIELDS: [keyof CaseStudy, string, string][] = [
  ['name', '学员称呼', '例：小美'],
  ['before_state', '开始前', '例：月入 RM3000，每月超支'],
  ['process', '过程', '例：花 3 周学习，第 4 周开始接单'],
  ['after_result', '结果', '例：副业收入 RM800/月'],
];
