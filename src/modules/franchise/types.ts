export type HierarchyLevel = 'owner' | 'regional_leader' | 'leader' | 'member';
export type InheritanceMode = 'inherited' | 'custom' | 'mixed';

export interface MasterBlueprint {
  id: string; ownerId: string; name: string; version: number; status: 'draft' | 'published' | 'archived';
  brandDNA: Record<string, unknown>; funnelContexts: Record<string, unknown>;
  funnels: Record<string, unknown>; leadMagnets: Record<string, unknown>;
  webinars: Record<string, unknown>; crmPipelines: Record<string, unknown>;
  automations: Record<string, unknown>; aiWorkforceSettings: Record<string, unknown>;
  missionPaths: string[]; createdAt: string; updatedAt: string;
}

export interface BlueprintAssignment {
  id: string; blueprintId: string; assigneeId: string; assignedBy: string;
  status: 'active' | 'pending' | 'revoked'; overrides: Record<string, unknown>;
  installedAt: string; lastSyncAt: string;
}

export interface BlueprintVersion {
  version: number; blueprintId: string; changes: string[]; publishedAt: string; publishedBy: string;
}

export interface FranchiseHealth {
  score: number; activationRate: number; executionRate: number; contentConsistency: number;
  leadGeneration: number; recruitmentActivity: number; missionCompletion: number;
  totalMembers: number; activeMembers: number; recommendations: string[];
}

export interface TeamMemberSummary {
  userId: string; name: string; level: HierarchyLevel; missionProgress: number;
  leadsGenerated: number; contentPublished: number; lastActive: string;
}
