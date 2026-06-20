import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { WhatsAppPackage, ObjectionType } from './types';
import { generateSmartReplies, qualifyLead, scoreLead, generateObjectionResponse, generateFollowupPlan, generateAppointmentFlow, generateBestFollowups } from './whatsappEngines';

export const whatsappService = {
  async generate(userId: string, tenantId: string): Promise<WhatsAppPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('请先完成品牌资料');

    // Get existing leads from CRM
    const leads = await prisma.lead.findMany({ where: { tenantId }, select: { id: true, name: true, score: true }, orderBy: { score: 'desc' } });

    const pkg: WhatsAppPackage = {
      smartReplies: {
        'price': generateSmartReplies(ctx, '多少钱'),
        'busy': generateSmartReplies(ctx, '没时间'),
        'general': generateSmartReplies(ctx, 'hello'),
      },
      qualifications: { 'default': qualifyLead(ctx, ctx.audiencePainPoints?.[0] || '', 'medium') },
      scoring: { 'default': scoreLead(55) },
      objections: {
        no_time: generateObjectionResponse('no_time', ctx),
        no_money: generateObjectionResponse('no_money', ctx),
        need_think: generateObjectionResponse('need_think', ctx),
        spouse: generateObjectionResponse('spouse', ctx),
        afraid: generateObjectionResponse('afraid', ctx),
        not_suitable: generateObjectionResponse('not_suitable', ctx),
        too_expensive: generateObjectionResponse('too_expensive', ctx),
        not_now: generateObjectionResponse('not_now', ctx),
      },
      followupTemplates: generateFollowupPlan(ctx),
      appointment: generateAppointmentFlow(ctx),
      bestFollowups: generateBestFollowups(leads.map(l => ({ id: l.id, name: l.name, score: l.score }))),
      voiceConfig: { provider: 'openai', enabled: true },
    };

    await this.save(userId, pkg);
    return pkg;
  },

  async save(userId: string, pkg: WhatsAppPackage) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, whatsapp_ai: pkg as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
  },

  async get(userId: string): Promise<WhatsAppPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const w = meta.whatsapp_ai; return w && typeof w === 'object' ? (w as WhatsAppPackage) : null;
  },

  async getCRMContext(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user) return null;
    const leads = await prisma.lead.findMany({ where: { tenantId: user.tenantId }, orderBy: { score: 'desc' }, take: 10 });
    return { totalLeads: leads.length, hotLeads: leads.filter(l => l.score >= 80).length, leads };
  },
};
