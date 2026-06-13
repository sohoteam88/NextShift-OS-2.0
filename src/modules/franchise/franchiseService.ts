// Franchise / Team Replication Service — "Build Once. Replicate Forever."
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { MasterBlueprint, BlueprintAssignment, BlueprintVersion, FranchiseHealth, TeamMemberSummary, HierarchyLevel } from './types';

export const franchiseService = {
  // ---- Master Blueprint ----
  async createBlueprint(ownerId: string, name: string, tenantId: string): Promise<MasterBlueprint> {
    const bp: MasterBlueprint = {
      id: `mbp-${Date.now()}`, ownerId, name, version: 1, status: 'draft',
      brandDNA: {}, funnelContexts: {}, funnels: {}, leadMagnets: {},
      webinars: {}, crmPipelines: {}, automations: {}, aiWorkforceSettings: {},
      missionPaths: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const user = await prisma.user.findUnique({ where: { id: ownerId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const blueprints: MasterBlueprint[] = Array.isArray(meta.master_blueprints) ? (meta.master_blueprints as MasterBlueprint[]) : [];
    blueprints.push(bp);
    await prisma.user.update({ where: { id: ownerId }, data: { metadata: { ...meta, master_blueprints: blueprints as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
    return bp;
  },

  async getBlueprints(ownerId: string): Promise<MasterBlueprint[]> {
    const user = await prisma.user.findUnique({ where: { id: ownerId }, select: { metadata: true } });
    return Array.isArray((user?.metadata as Record<string, unknown>)?.master_blueprints) ? (user?.metadata as Record<string, unknown>).master_blueprints as MasterBlueprint[] : [];
  },

  // ---- Assignment ----
  async assign(blueprintId: string, assigneeId: string, assignedBy: string): Promise<BlueprintAssignment> {
    const assignment: BlueprintAssignment = {
      id: `asgn-${Date.now()}`, blueprintId, assigneeId, assignedBy,
      status: 'active', overrides: {}, installedAt: new Date().toISOString(), lastSyncAt: new Date().toISOString(),
    };
    const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({ where: { id: assigneeId }, data: { metadata: { ...meta, blueprint_assignment: assignment as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
    return assignment;
  },

  async getMyAssignment(userId: string): Promise<BlueprintAssignment | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const a = meta.blueprint_assignment;
    return a && typeof a === 'object' ? (a as BlueprintAssignment) : null;
  },

  // ---- Versioning ----
  async publishVersion(blueprintId: string, ownerId: string, changes: string[]): Promise<BlueprintVersion> {
    const user = await prisma.user.findUnique({ where: { id: ownerId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const blueprints: MasterBlueprint[] = Array.isArray(meta.master_blueprints) ? (meta.master_blueprints as MasterBlueprint[]) : [];
    const idx = blueprints.findIndex(b => b.id === blueprintId);
    if (idx < 0) throw new Error('Blueprint not found');
    blueprints[idx].version += 1;
    blueprints[idx].updatedAt = new Date().toISOString();
    await prisma.user.update({ where: { id: ownerId }, data: { metadata: { ...meta, master_blueprints: blueprints as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
    const version: BlueprintVersion = { version: blueprints[idx].version, blueprintId, changes, publishedAt: new Date().toISOString(), publishedBy: ownerId };
    return version;
  },

  // ---- Team Overview ----
  async getTeamMembers(leaderId: string, tenantId: string): Promise<TeamMemberSummary[]> {
    // Get users sponsored by this leader
    const members = await prisma.user.findMany({
      where: { tenantId, sponsorId: leaderId, deletedAt: null },
      select: { id: true, name: true, role: true, updatedAt: true },
    });
    const summaries: TeamMemberSummary[] = [];
    for (const m of members) {
      const progress = await prisma.userProgress.findUnique({ where: { userId: m.id }, select: { currentStageId: true } });
      const leads = await prisma.lead.count({ where: { tenantId, ownerId: m.id, deletedAt: null } });
      const content = await prisma.content.count({ where: { ownerId: m.id } });
      summaries.push({
        userId: m.id, name: m.name, level: (m.role as HierarchyLevel) ?? 'member',
        missionProgress: progress ? 50 : 0, leadsGenerated: leads, contentPublished: content,
        lastActive: m.updatedAt.toISOString(),
      });
    }
    return summaries;
  },

  // ---- Franchise Health ----
  async getFranchiseHealth(leaderId: string, tenantId: string): Promise<FranchiseHealth> {
    const members = await this.getTeamMembers(leaderId, tenantId);
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.missionProgress > 10).length;
    const leads = members.reduce((s, m) => s + m.leadsGenerated, 0);
    const content = members.reduce((s, m) => s + m.contentPublished, 0);

    const activationRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    const executionRate = content > 0 ? Math.min(100, content * 10) : 0;
    const score = Math.round(activationRate * 0.3 + executionRate * 0.3 + (leads > 0 ? 20 : 0) + (totalMembers > 0 ? 20 : 0));

    const recs: string[] = [];
    if (activationRate < 50) recs.push('激活率偏低，加强新成员培训。');
    if (executionRate < 30) recs.push('内容产出不足，提供内容模板。');

    return { score, activationRate, executionRate, contentConsistency: executionRate, leadGeneration: leads, recruitmentActivity: totalMembers, missionCompletion: activationRate, totalMembers, activeMembers, recommendations: recs };
  },
};
