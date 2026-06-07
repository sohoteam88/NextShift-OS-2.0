export type AdminUserRole = 'member' | 'leader' | 'operator' | 'platform_admin';
export type AdminUserStatus = 'active' | 'pending' | 'suspended';

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  avatarUrl: string | null;
  languagePreference: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  data: AdminUserRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TenantUsageStats = {
  users: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  byRole: {
    operator: number;
    leader: number;
    member: number;
    platform_admin: number;
  };
  limits: {
    max_members: number;
    max_ai_calls: number;
    max_storage_mb: number;
  };
  usage: {
    current_members: number;
    ai_calls_this_month: number;
    storage_used_mb: number;
  };
};

export type TenantSettingsPayload = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxMembers: number;
  maxAiCalls: number;
  status: string;
  settings: Record<string, unknown>;
};

export type AdminSettingsResponse = {
  data: {
    tenant: TenantSettingsPayload;
    stats: TenantUsageStats;
  };
};

export type AdminTemplateSummary = {
  id: string;
  name: string;
  type: string;
  category?: string;
  usageCount: number;
  isDefault: boolean;
  variables?: string[];
  modelPreference?: string;
  language?: string;
};

export type TenantQuotaUsage = {
  members: {
    used: number;
    limit: number;
  };
  ai_calls: {
    used: number;
    limit: number;
  };
  storage_mb: {
    used: number;
    limit: number;
  };
  funnels: {
    used: number;
    limit: number;
  };
  sequences: {
    used: number;
    limit: number;
  };
};

export type PlatformTenantOverview = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  maxMembers: number;
  maxAiCalls: number;
  createdAt: string;
  updatedAt: string;
  usage: TenantQuotaUsage;
  aiCallsThisMonth: number;
  aiCostThisMonth: number;
};

export type PlatformTenantDetail = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    maxMembers: number;
    maxAiCalls: number;
    settings: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  usage: TenantQuotaUsage;
  ai: {
    callsThisMonth: number;
    costThisMonth: number;
    byFeature: Record<string, { calls: number; cost: number }>;
  };
  users: AdminUserRecord[];
  leads: {
    total: number;
    byStage: Array<{ stage: string; count: number }>;
  };
  funnels: Array<{
    id: string;
    title: string;
    status: string;
    views: number;
    conversions: number;
    createdAt: string;
  }>;
  storageUsedMb: number;
};

export type PlatformAICostBreakdown = {
  tenantId: string;
  tenantName: string;
  slug: string;
  plan: string;
  callsThisMonth: number;
  costThisMonth: number;
};

export type PlatformStats = {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_leads: number;
  total_funnels: number;
  ai_cost_this_month: number;
  ai_calls_this_month: number;
  tenants_by_plan: {
    starter: number;
    growth: number;
    pro: number;
  };
};
