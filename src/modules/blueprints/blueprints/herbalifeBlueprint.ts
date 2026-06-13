import type { BlueprintDefinition } from '../types';

export const HERBALIFE_BLUEPRINT: BlueprintDefinition = {
  id: 'herbalife_v1', name: 'Herbalife Business Blueprint V1', description: 'Complete business system for Herbalife distributors — Retail, Recruitment, and Upgrade funnels.', category: 'network_marketing', version: '1.0.0',
  supportedFunnels: ['retail', 'recruitment', 'upgrade'],
  supportedLanguages: ['en', 'zh', 'ms'],
  installSteps: ['Generate Brand DNA preset', 'Activate 3 funnels', 'Install content pillars', 'Configure CRM pipelines', 'Activate automation templates'],
  brandDNA: {
    brandPositioning: '健康生活顾问 | AI系统赋能',
    targetAudience: '注重健康的在职人士',
    contentTone: '温暖亲切',
    primaryOffer: '免费健康评估 + 副业机会咨询',
    slogan: '健康生活，AI赋能',
    brandColors: ['#22c55e', '#16a34a', '#f59e0b'],
  },
  funnels: {
    retail: {
      leadMagnetTitle: '3分钟健康准备度评估', leadMagnetPromise: '了解你的健康状态，获取个性化建议。',
      contentPillars: [
        { name: '健康知识', emoji: '🥗', percentage: 40, description: '科学健康知识和营养科普' },
        { name: '客户见证', emoji: '⭐', percentage: 30, description: '真实案例和转变故事' },
        { name: '产品分享', emoji: '🛍', percentage: 20, description: 'Herbalife产品体验' },
        { name: '生活方式', emoji: '🌿', percentage: 10, description: '日常健康习惯分享' },
      ],
      videoThemes: ['减肥技巧', '健康习惯', '营养误区', '客户故事'],
      cta: '获取免费健康评估', webinarTheme: '如何在90天改善你的健康指标',
    },
    recruitment: {
      leadMagnetTitle: '副业准备度评估', leadMagnetPromise: '3分钟测出你是否适合建立AI副业系统。',
      contentPillars: [
        { name: '副业机会', emoji: '💼', percentage: 35, description: 'Herbalife副业思路和机会' },
        { name: '成功案例', emoji: '🏆', percentage: 30, description: '真实收入分享' },
        { name: 'AI工具', emoji: '🤖', percentage: 20, description: 'AI系统培训' },
        { name: '团队文化', emoji: '🤝', percentage: 15, description: '团队氛围和活动' },
      ],
      videoThemes: ['收入增长', 'AI效率', '个人品牌之路', '机会分享'],
      cta: '获取副业准备度评估', webinarTheme: '如何在30天内建立AI副业系统',
    },
    upgrade: {
      leadMagnetTitle: '会员就绪度评估', leadMagnetPromise: '看看你是否准备好从客户升级为合作伙伴。',
      contentPillars: [
        { name: '会员故事', emoji: '📖', percentage: 30, description: '从客户到伙伴的真实经历' },
        { name: '社群价值', emoji: '💎', percentage: 25, description: '社群带来的改变' },
        { name: '进阶机会', emoji: '🚀', percentage: 25, description: '升级后的新可能' },
        { name: '专属福利', emoji: '🎁', percentage: 20, description: '会员专属内容和活动' },
      ],
      videoThemes: ['客户旅程', '团队文化', '个人成长', '领导力发展'],
      cta: '加入NextShift会员社群', webinarTheme: '从客户到合作伙伴的旅程',
    },
  },
  automationTemplates: ['tpl_assessment_followup', 'tpl_hot_lead_escalation', 'tpl_webinar_followup'],
  crmPipelines: {
    retail: ['New Lead', 'Assessment Sent', 'Consultation Booked', 'Customer', 'Repeat Customer'],
    recruitment: ['New Lead', 'Assessment Sent', 'Webinar Attended', 'Strategy Call', 'Member', 'Builder', 'Leader'],
    upgrade: ['Customer', 'Engaged', 'Webinar Invited', 'Member', 'Builder'],
  },
  whatsappScripts: {
    retail: [
      { trigger: 'health_inquiry', reply: '你好！感谢你对健康评估的兴趣。我先问你几个简单问题了解你的情况？' },
      { trigger: 'weight_management', reply: '理解你的需求。很多客户通过我们的系统成功管理了体重。想了解更多吗？' },
    ],
    recruitment: [
      { trigger: 'income_inquiry', reply: '你好！感谢你对副业机会的兴趣。你想了解哪方面？零售还是建立团队？' },
      { trigger: 'webinar_invite', reply: '这周有一场线上分享会，会详细讲解如何用AI系统建立副业。我发链接给你？' },
    ],
    upgrade: [
      { trigger: 'customer_followup', reply: '你好！作为我们的老客户，想了解你最近的使用体验如何？' },
      { trigger: 'community_invite', reply: '我们有一个非常活跃的会员社群，想邀请你来体验一下。' },
    ],
  },
};
