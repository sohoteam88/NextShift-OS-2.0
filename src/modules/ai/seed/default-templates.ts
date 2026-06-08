import type { Prisma, PrismaClient } from '@prisma/client';

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

type SeedTemplate = {
  name: string;
  category: string;
  language: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  modelPreference?: string;
};

const DEFAULT_TEMPLATES: SeedTemplate[] = [
  {
    name: 'Social Post Generator',
    category: 'content',
    language: 'zh',
    systemPrompt:
      '你是一个健康顾问的社交媒体内容专家。你必须教育优先，不夸大效果，不承诺收入，不使用夸张医疗承诺。',
    userPromptTemplate:
      '请为以下主题创建一篇适合社交媒体的帖子。\n\n用户信息：\n- 名字：{user_name}\n- 专长：{specialty}\n- 目标受众：{target_audience}\n\n内容要求：\n- 主题：{topic}\n- 平台：{platform}\n- 语气：{tone}\n- 开头要抓住注意力\n- 内容要提供实际价值\n- 结尾引导互动\n- 适配 {platform} 的表达方式',
    variables: ['user_name', 'specialty', 'target_audience', 'topic', 'platform', 'tone'],
    modelPreference: 'anthropic',
  },
  {
    name: 'Social Post Generator',
    category: 'content',
    language: 'en',
    systemPrompt:
      'You are a social media content expert for health consultants. Keep it education-first, do not promise income, and avoid exaggerated medical claims.',
    userPromptTemplate:
      'Create a social media post for the topic below.\n\nUser info:\n- Name: {user_name}\n- Specialty: {specialty}\n- Target audience: {target_audience}\n\nContent requirements:\n- Topic: {topic}\n- Platform: {platform}\n- Tone: {tone}\n- Start with a strong hook\n- Provide practical value\n- End with an engagement prompt\n- Match the style of {platform}',
    variables: ['user_name', 'specialty', 'target_audience', 'topic', 'platform', 'tone'],
    modelPreference: 'anthropic',
  },
  {
    name: 'WhatsApp Reply Suggest',
    category: 'whatsapp_reply',
    language: 'zh',
    systemPrompt:
      '你是一个友好的健康顾问对话助手。回答要同理、简洁、专业，帮助线索迈出下一步。',
    userPromptTemplate:
      '请根据以下信息生成一条 WhatsApp 回复建议。\n\n用户：{user_name}\n线索：{lead_name}\n线索状态：{lead_stage}\n线索备注：{lead_notes}\n消息上下文：{message_context}\n\n要求：\n- 语气友好、自然\n- 先回应对方关切\n- 再引导下一步\n- 不要过度推销',
    variables: ['user_name', 'lead_name', 'lead_stage', 'lead_notes', 'message_context'],
    modelPreference: 'anthropic',
  },
  {
    name: 'Lead Analysis',
    category: 'lead_analysis',
    language: 'zh',
    systemPrompt:
      '你是一个 CRM 分析助手。请总结线索情况、判断优先级，并给出下一步建议。',
    userPromptTemplate:
      '请分析以下线索并给出下一步建议。\n\n线索名称：{lead_name}\n来源：{lead_source}\n状态：{lead_stage}\n评分：{lead_score}\n备注：{lead_notes}\n\n请输出：\n1. 线索摘要\n2. 风险或机会\n3. 建议的下一步行动',
    variables: ['lead_name', 'lead_source', 'lead_stage', 'lead_score', 'lead_notes'],
    modelPreference: 'anthropic',
  },
  {
    name: 'WhatsApp Reply Suggest',
    category: 'whatsapp_reply',
    language: 'zh',
    systemPrompt:
      '你是一位专业的健康顾问助手。根据客户的信息和对话内容，生成 3 个 WhatsApp 回复选项。',
    userPromptTemplate:
      '客户信息：\n- 姓名：{lead_name}\n- 阶段：{lead_stage}\n- 评分：{lead_score}\n- 备注：{lead_notes}\n\n要求：\n1. 生成 3 个回复选项：简短（1-2句）、标准（3-4句）、详细（5-6句）\n2. 语气温暖、专业、不推销\n3. 根据客户阶段调整内容\n4. 包含适当的下一步引导\n5. 不要提及收入或金钱承诺\n6. 用 JSON 格式返回：[{label, text}]\n\n客户消息：{message_context}',
    variables: ['user_name', 'lead_name', 'lead_stage', 'lead_score', 'lead_notes', 'message_context'],
    modelPreference: 'anthropic',
  },
  {
    name: 'Lead Analysis',
    category: 'lead_analysis',
    language: 'zh',
    systemPrompt:
      '你是一位 CRM 数据分析师。分析以下潜在客户的资料，提供结构化分析报告。',
    userPromptTemplate:
      '客户：{lead_name}\n来源：{lead_source}\n阶段：{lead_stage}\n评分：{lead_score}/100\n最近备注：{lead_notes}\n\n返回 JSON 格式：\n{\n  "summary": "2-3句简介",\n  "engagement_level": "high/medium/low",\n  "next_best_action": "具体建议",\n  "talking_points": ["要点1", "要点2", "要点3"],\n  "risk_factors": [],\n  "estimated_conversion_likelihood": "high/medium/low",\n  "recommended_followup_days": 数字\n}',
    variables: ['lead_name', 'lead_source', 'lead_stage', 'lead_score', 'lead_notes'],
    modelPreference: 'anthropic',
  },
];

async function ensureTemplate(client: DatabaseClient, tenantId: string, template: SeedTemplate) {
  const existing = await client.aIPromptTemplate.findFirst({
    where: {
      tenantId,
      name: template.name,
      language: template.language,
      category: template.category,
    },
  });

  if (existing) return existing;

  return client.aIPromptTemplate.create({
    data: {
      tenantId,
      name: template.name,
      category: template.category,
      language: template.language,
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
      prompt: [template.systemPrompt.trim(), template.userPromptTemplate.trim()].join('\n\n'),
      variables: template.variables,
      modelPreference: template.modelPreference ?? 'anthropic',
      isDefault: true,
    },
  });
}

const FUNNEL_COPY_TEMPLATE: SeedTemplate = {
  name: 'Funnel Copy Generator',
  category: 'funnel_copy',
  language: 'zh',
  systemPrompt: '你是一位专业的营销文案专家，擅长为健康和保健行业创建高转化的漏斗页面文案。不提及具体收入金额，不使用夸大的医疗声明，用教育和价值导向的语气。只返回有效的 JSON，不要包含任何其他文字。',
  userPromptTemplate: '请为以下漏斗页面生成完整文案：\n\n类型：{funnel_type}\n目标受众：{audience}\n产品/服务：{product}\n优惠：{offer}\n\n返回 JSON 格式：{"hero":{"headline":"","subheadline":"","cta_text":""},"pain":{"title":"","items":[{"text":""}]},"mechanism":{"title":"","description":""},"benefits":{"title":"","items":[{"icon":"heart","title":"","description":""}]},"faq":{"title":"","items":[{"question":"","answer":""}]},"cta":{"headline":"","subheadline":"","button_text":""}}',
  variables: ['funnel_type', 'audience', 'product', 'offer'],
  modelPreference: 'anthropic',
};

export async function seedDefaultTemplates(client: DatabaseClient, tenantId: string) {
  const created = [];
  for (const template of [...DEFAULT_TEMPLATES, FUNNEL_COPY_TEMPLATE]) {
    created.push(await ensureTemplate(client, tenantId, template));
  }
  return created;
}
