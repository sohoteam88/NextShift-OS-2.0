// WhatsApp Engines — all deterministic
import type { BrandContext } from '@/modules/brand-dna/types';
import type { SmartReply, LeadQualification, LeadScoring, ObjectionResponse, FollowupPlan, AppointmentFlow, BestFollowup, ObjectionType, LeadScore } from './types';

// ---- Smart Reply ----
export function generateSmartReplies(ctx: BrandContext, userMessage: string): SmartReply[] {
  const lower = userMessage.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('多少钱') || lower.includes('收费')) {
    return [
      { text: `价格取决于你的具体需求。不如我们先聊15分钟，我了解你的情况后给你一个准确的方案？`, style: 'soft', reason: '先建立价值再谈价格' },
      { text: `${ctx.offer.primary || '这个服务'}的投资回报通常远超投入。我分享一个案例给你？`, style: 'value_first', reason: '用案例证明价值' },
      { text: `${ctx.offer.primary || '服务'}的价格是[price]。包含${ctx.offer.transformation || '完整的'}支持。想了解更多细节？`, style: 'direct', reason: '直接回应，适合已建立信任的Lead' },
    ];
  }
  if (lower.includes('busy') || lower.includes('没时间') || lower.includes('time')) {
    return [
      { text: `理解你很忙。这正是为什么这套系统适合你——AI帮你做80%的工作，你每天只需要15分钟。`, style: 'value_first', reason: '把时间问题转化为解决方案' },
      { text: `没关系的。我分享一些免费内容给你，你可以在方便的时候看。`, style: 'soft', reason: '不施压，保持关系' },
    ];
  }
  // Default
  return [
    { text: `感谢你的询问！${ctx.personalName || '我'}很乐意帮助你。可以先告诉我你最大的挑战是什么吗？`, style: 'soft', reason: '开场建立对话' },
    { text: `很高兴你问这个问题。${ctx.positioning || ''}\n\n你想从哪个方面开始了解？`, style: 'value_first', reason: '展示专业' },
    { text: `${ctx.offer.transformation || '让我帮你'}。你想先了解什么？`, style: 'direct', reason: '直接回应' },
  ];
}

// ---- Lead Qualification ----
export function qualifyLead(ctx: BrandContext, pain: string, urgencyStr: string): LeadQualification {
  return {
    qualificationScore: urgencyStr === 'high' ? 85 : urgencyStr === 'medium' ? 55 : 25,
    goals: `想解决${pain || ctx.audiencePainPoints?.[0] || '个人品牌问题'}`,
    painPoints: pain || ctx.audiencePainPoints?.[0] || '不确定如何开始',
    urgency: (urgencyStr === 'high' || urgencyStr === 'medium' || urgencyStr === 'low') ? urgencyStr : 'medium',
    budgetReadiness: false, decisionReadiness: false,
    summary: `Lead关注${pain || '个人品牌'}，紧迫度${urgencyStr || '中'}。建议先提供教育内容建立信任。`,
    nextAction: '发送一条有价值的内容 + 48小时内跟进',
  };
}

// ---- Lead Scoring ----
const SCORE_CRITERIA: Record<LeadScore, { min: number; reason: string; recommendation: string }> = {
  A: { min: 80, reason: '高参与度+高紧迫度+CTA点击', recommendation: '立即预约通话/发送完整方案' },
  B: { min: 50, reason: '有兴趣但需要更多信息', recommendation: '发送案例+教育内容+48h跟进' },
  C: { min: 25, reason: '在探索阶段', recommendation: '保持轻触达，每周发1-2条价值内容' },
  D: { min: 0, reason: '时机未到或不符合', recommendation: '每月触达一次，不要强推' },
};

export function scoreLead(qualificationScore: number): LeadScoring {
  const entries = Object.entries(SCORE_CRITERIA) as [LeadScore, typeof SCORE_CRITERIA[LeadScore]][];
  for (const [score, criteria] of entries) {
    if (qualificationScore >= criteria.min) return { score, reason: criteria.reason, recommendation: criteria.recommendation };
  }
  return { score: 'D', reason: SCORE_CRITERIA.D.reason, recommendation: SCORE_CRITERIA.D.recommendation };
}

// ---- Objection Handling ----
export function generateObjectionResponse(type: ObjectionType, ctx: BrandContext): ObjectionResponse {
  const map: Record<ObjectionType, ObjectionResponse> = {
    no_time: { empathyResponse: '完全理解，现在大家都忙。', clarificationQuestion: '如果每天只需要15分钟，你觉得能接受吗？', valueResponse: `这套系统就是为忙碌的${ctx.audience || '你'}设计的——AI做80%的工作。`, cta: '我发一个免费模板给你试试？' },
    no_money: { empathyResponse: '理解，投资确实需要慎重考虑。', clarificationQuestion: '你觉得什么价格范围是你可以接受的？', valueResponse: '比起继续浪费时间摸索，有系统的投资回报更高。可以先从免费的资源开始。', cta: '想先看看免费的案例吗？' },
    need_think: { empathyResponse: '当然，做决定需要时间。', clarificationQuestion: '有什么具体的问题我可以帮你解答吗？', valueResponse: '想清楚是对的。这里有份资料你可以看看，有问题随时问我。', cta: '我3天后跟你确认？' },
    spouse: { empathyResponse: '理解，家人意见很重要。', clarificationQuestion: '你觉得他们最大的顾虑是什么？', valueResponse: '很多成功的学员一开始也遇到家人反对，但看到结果后都转变了。', cta: '要不你和家人一起看看案例？' },
    afraid: { empathyResponse: '我也有过同样的感觉，这很正常。', clarificationQuestion: '你最担心的是什么？', valueResponse: `${ctx.personalName || '我'}一开始也怕，但第一步跨出去后就知道不可怕了。`, cta: '先从最简单的一步开始，我陪你。' },
    not_suitable: { empathyResponse: '理解你的顾虑。', clarificationQuestion: '你觉得哪里不适合？', valueResponse: `这个系统适合${ctx.audience || '大多数人'}，但我们可以先聊聊再判断。`, cta: '先做免费评估看看？' },
    too_expensive: { empathyResponse: '理解，价格是一个重要的考量。', clarificationQuestion: '如果分期付款，会不会容易接受一点？', valueResponse: `比起${ctx.offer.transformation || '结果'}，这个投资很值得。`, cta: '看看有没有适合你的方案。' },
    not_now: { empathyResponse: '没问题，什么时候都欢迎你来。', clarificationQuestion: '你觉得什么时候会比较合适？', valueResponse: '不着急。我先发一些免费内容给你看。', cta: '我下个月再联系你？' },
  };
  return map[type];
}

// ---- Follow-up Engine ----
export function generateFollowupPlan(ctx: BrandContext): FollowupPlan[] {
  return [
    { id: 'fu-1', day: 1, label: '初次跟进', message: `你好！感谢上次的交流。想确认你还有什么问题吗？`, status: 'pending' },
    { id: 'fu-2', day: 3, label: '教育内容', message: `分享一个关于${ctx.audience || '个人品牌'}的实用技巧：${ctx.messaging.coreMessage || '先从定位开始'}。`, status: 'pending' },
    { id: 'fu-3', day: 5, label: '案例分享', message: `分享一个真实案例：一位${ctx.audience || '客户'}用这套系统实现了${ctx.offer.transformation || '目标'}。`, status: 'pending' },
    { id: 'fu-4', day: 7, label: 'Offer提醒', message: `提醒一下：${ctx.offer.primary || '专属优惠'}还有几天。如果准备好了，随时告诉我。`, status: 'pending' },
    { id: 'fu-5', day: 14, label: '重新激活', message: `好久不见！最近怎么样？我这里有新的${ctx.audience || '个人品牌'}资源，想发给你看看。`, status: 'pending' },
  ];
}

// ---- Appointment ----
export function generateAppointmentFlow(ctx: BrandContext): AppointmentFlow {
  return {
    bookingInvitation: `${ctx.personalName || '你好'}！很高兴跟你聊了这么多。如果你准备好了，我们可以约一个15分钟的策略通话，更具体地聊聊你的情况。`,
    reminder24h: `提醒：明天${ctx.personalName ? `和${ctx.personalName}` : ''}的策略通话。准备好了吗？`,
    reminder1h: `1小时后见！准备好问题，我们高效地聊。`,
    confirmation: `通话已确认！${ctx.personalName || '我'}会在约定的时间联系你。`,
    reschedule: `没关系！我们可以换一个更适合的时间。你什么时候方便？`,
  };
}

// ---- Best Follow-up ----
export function generateBestFollowups(leads: Array<{ id: string; name: string; score: number }>): BestFollowup[] {
  const sorted = [...leads].sort((a, b) => b.score - a.score).slice(0, 5);
  return sorted.map(l => ({
    leadId: l.id, leadName: l.name,
    score: l.score >= 80 ? 'A' : l.score >= 50 ? 'B' : l.score >= 25 ? 'C' : 'D',
    reason: l.score >= 80 ? '高活跃度，立即跟进' : l.score >= 50 ? '有兴趣，48h内跟进' : '需培养',
    suggestedMessage: l.score >= 80 ? '你好！上次聊得很愉快。要不要约个时间深入聊聊？' : '分享一个你可能感兴趣的内容...',
  }));
}
