import prisma from '@/lib/prisma';

export type ScoringReason = {
  signal: string;
  points: number;
  description: string;
};

type LeadForScoring = {
  id?: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  metadata?: unknown;
  activities?: { type: string; createdAt: Date }[];
};

export function calculateLeadScore(lead: LeadForScoring): { score: number; reasons: ScoringReason[] } {
  const reasons: ScoringReason[] = [];
  let score = 0;

  // Contact info signals
  if (lead.phone) {
    score += 10;
    reasons.push({ signal: 'has_phone', points: 10, description: '有电话号码' });
  }
  if (lead.email) {
    score += 5;
    reasons.push({ signal: 'has_email', points: 5, description: '有电子邮件' });
  }

  // Source signals
  if (lead.source && lead.source !== 'manual') {
    score += 10;
    reasons.push({ signal: 'funnel_source', points: 10, description: `来源: ${lead.source}` });
  }

  // Quiz completion (stored in metadata)
  const meta = lead.metadata as Record<string, unknown> | null | undefined;
  if (meta && typeof meta === 'object' && meta.quiz_completed) {
    score += 15;
    reasons.push({ signal: 'quiz_completed', points: 15, description: '完成健康问卷' });
  }

  // Activity-based signals
  if (lead.activities && lead.activities.length > 0) {
    const hasReply = lead.activities.some(
      (a) => a.type === 'whatsapp_reply' || a.type === 'reply',
    );
    if (hasReply) {
      score += 20;
      reasons.push({ signal: 'replied', points: 20, description: '回复了消息' });
    }

    const interactionCount = lead.activities.filter((a) =>
      ['call', 'whatsapp', 'email', 'meeting', 'reply', 'whatsapp_reply'].includes(a.type),
    ).length;
    const interactionPoints = Math.min(interactionCount * 5, 25);
    if (interactionPoints > 0) {
      score += interactionPoints;
      reasons.push({
        signal: 'interactions',
        points: interactionPoints,
        description: `${interactionCount} 次互动`,
      });
    }

    // Recency penalty
    const lastActivity = lead.activities.reduce(
      (latest, a) => (a.createdAt > latest ? a.createdAt : latest),
      lead.activities[0].createdAt,
    );
    const daysSince = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince > 30) {
      score -= 20;
      reasons.push({ signal: 'stale_30d', points: -20, description: `${daysSince} 天未联系` });
    } else if (daysSince > 14) {
      score -= 10;
      reasons.push({ signal: 'stale_14d', points: -10, description: `${daysSince} 天未联系` });
    }
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export function getScoreCategory(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export async function recalculateLeadScore(leadId: string): Promise<number> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        select: { type: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
  });

  if (!lead) return 0;

  const { score, reasons } = calculateLeadScore(lead);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score,
      scoreReasons: reasons as never,
      scoreUpdatedAt: new Date(),
    },
  });

  return score;
}

export async function recalculateAllLeadScores(tenantId: string): Promise<number> {
  const leads = await prisma.lead.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      activities: {
        select: { type: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
  });

  for (const lead of leads) {
    const { score, reasons } = calculateLeadScore(lead);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { score, scoreReasons: reasons as never, scoreUpdatedAt: new Date() },
    });
  }

  return leads.length;
}
