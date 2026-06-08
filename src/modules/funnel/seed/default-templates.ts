import type { Prisma, PrismaClient } from '@prisma/client';

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

const LANDING_CONFIG = {
  type: 'landing',
  theme: { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' },
  sections: [
    { type: 'hero', headline: '找到适合你的健康方案', subheadline: '免费 30 分钟健康咨询，专业顾问一对一指导', cta_text: '立即预约 WhatsApp 咨询', cta_type: 'whatsapp', cta_target: '' },
    { type: 'pain', title: '你是否有这些困扰？', items: [{ text: '尝试过各种减肥方法但总是反弹' }, { text: '工作太忙没时间照顾健康' }, { text: '不知道该吃什么才能达到健康目标' }] },
    { type: 'mechanism', title: '为什么需要个性化方案？', description: '每个人的体质、生活习惯和目标不同，通用的方法往往效果有限。通过专业的健康评估，我们帮你找到最适合你的方案。' },
    { type: 'benefits', title: '你会获得', items: [{ icon: 'heart', title: '个性化健康评估', description: '了解你的身体状况和需求' }, { icon: 'target', title: '定制方案', description: '根据你的目标制定计划' }, { icon: 'clock', title: '持续跟进', description: '专业顾问全程支持' }] },
    { type: 'testimonial', title: '他们已经成功了', items: [] },
    { type: 'faq', title: '常见问题', items: [{ question: '咨询是免费的吗？', answer: '是的，第一次 30 分钟咨询完全免费。' }, { question: '需要准备什么？', answer: '不需要特别准备，我们会通过 WhatsApp 和你交流。' }] },
    { type: 'cta', headline: '开始你的健康旅程', button_text: 'WhatsApp 预约免费咨询', button_type: 'whatsapp', button_target: '' },
  ],
};

const QUIZ_CONFIG = {
  type: 'quiz',
  theme: { primary_color: '#10b981', bg_color: '#ffffff', font: 'system' },
  sections: [
    { type: 'hero', headline: '你的健康管理类型是什么？', subheadline: '3 分钟测试，找到最适合你的健康方案', cta_text: '开始测试', cta_type: 'form', cta_target: '#quiz' },
  ],
  quiz: {
    capture_before_results: true,
    questions: [
      { text: '你目前最大的健康困扰是什么？', options: [{ text: '体重管理', score: 3 }, { text: '精力不足', score: 2 }, { text: '睡眠质量差', score: 1 }, { text: '饮食不均衡', score: 2 }] },
      { text: '你每周运动几次？', options: [{ text: '几乎不运动', score: 1 }, { text: '1-2次', score: 2 }, { text: '3-4次', score: 3 }, { text: '5次以上', score: 4 }] },
      { text: '你的饮食习惯如何？', options: [{ text: '经常外食', score: 1 }, { text: '偶尔自己做饭', score: 2 }, { text: '大部分自己准备', score: 3 }, { text: '严格控制饮食', score: 4 }] },
      { text: '你愿意每天投入多少时间在健康上？', options: [{ text: '15分钟', score: 1 }, { text: '30分钟', score: 2 }, { text: '1小时', score: 3 }, { text: '1小时以上', score: 4 }] },
      { text: '你最想达到什么目标？', options: [{ text: '减重 5-10kg', score: 3 }, { text: '提升精力和体质', score: 2 }, { text: '建立健康生活习惯', score: 2 }, { text: '增肌塑形', score: 3 }] },
    ],
    results: [
      { min_score: 5, max_score: 10, title: '基础调整型', description: '你需要从基础的饮食和生活习惯开始调整。', cta_text: '了解入门方案', cta_target: '' },
      { min_score: 11, max_score: 15, title: '进阶提升型', description: '你已经有一定的健康基础，需要更个性化的指导来突破瓶颈。', cta_text: '获取个性化方案', cta_target: '' },
      { min_score: 16, max_score: 20, title: '全面优化型', description: '你的健康意识很强！一个全面的优化方案可以帮你达到最佳状态。', cta_text: '预约专业评估', cta_target: '' },
    ],
  },
};

const LEAD_MAGNET_CONFIG = {
  type: 'lead_magnet',
  theme: { primary_color: '#7c3aed', bg_color: '#ffffff', font: 'system' },
  sections: [
    { type: 'hero', headline: '免费下载：7 天健康餐食谱', subheadline: '忙碌妈妈专属，每天 15 分钟准备全家健康餐', image_url: '', cta_text: '免费领取', cta_type: 'form', cta_target: '#form' },
    { type: 'benefits', title: '食谱包含', items: [{ icon: 'book', title: '7 天完整菜单', description: '早中晚餐 + 加餐建议' }, { icon: 'clock', title: '15 分钟快手菜', description: '适合忙碌的工作日' }, { icon: 'shopping-cart', title: '一次性采购清单', description: '周末一次买齐一周食材' }] },
    { type: 'form', title: '输入信息免费领取', fields: ['name', 'phone'], submit_text: '立即领取食谱', success_message: '食谱已发送到你的 WhatsApp！请查收 📱', whatsapp_redirect: '' },
  ],
};

export async function seedFunnelTemplates(client: DatabaseClient, tenantId: string): Promise<void> {
  const templates = [
    { name: '健康咨询落地页', type: 'landing', config: LANDING_CONFIG },
    { name: '健康测试问卷', type: 'quiz', config: QUIZ_CONFIG },
    { name: '免费食谱下载页', type: 'lead_magnet', config: LEAD_MAGNET_CONFIG },
  ];

  for (const t of templates) {
    const existing = await client.funnelTemplate.findFirst({
      where: { tenantId, name: t.name },
    });
    if (!existing) {
      await client.funnelTemplate.create({
        data: {
          tenantId,
          name: t.name,
          type: t.type,
          config: t.config as Prisma.InputJsonValue,
        },
      });
    }
  }
}
