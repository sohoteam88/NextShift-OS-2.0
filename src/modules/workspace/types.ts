export type WorkspaceType =
  | 'retail'
  | 'recruitment'
  | (string & {});

export type WorkspaceStatus = 'active' | 'archived';

export type WorkspaceId = string & { readonly __brand: 'WorkspaceId' };
export type MemberId = string & { readonly __brand: 'MemberId' };

export type WorkspaceCapability =
  | 'dashboard'
  | 'crm'
  | 'content'
  | 'funnel'
  | 'landing'
  | 'analytics'
  | 'ai_coach';

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'leader'
  | 'member'
  | (string & {});

export type WorkspacePermission =
  | 'workspace:read'
  | 'workspace:manage'
  | 'dashboard:read'
  | 'crm:read'
  | 'crm:write'
  | 'content:read'
  | 'content:write'
  | 'funnel:read'
  | 'funnel:write'
  | 'landing:read'
  | 'landing:write'
  | 'analytics:read'
  | 'ai_coach:use'
  | (string & {});

export type WorkspaceMembershipStatus = 'active' | 'invited' | 'archived';

export interface Workspace {
  readonly workspaceId: WorkspaceId;
  readonly tenantId: string;
  readonly workspaceType: WorkspaceType;
  readonly status: WorkspaceStatus;
  readonly displayName: string;
  readonly isDefault?: boolean;
}

export interface WorkspaceMembership {
  readonly workspaceId: WorkspaceId;
  readonly tenantId: string;
  readonly memberId: MemberId;
  readonly role: WorkspaceRole;
  readonly permissions: readonly WorkspacePermission[];
  readonly status: WorkspaceMembershipStatus;
}

export interface WorkspaceCapabilityConfig {
  readonly focus: readonly string[];
  readonly metrics: readonly string[];
  readonly language: readonly string[];
}

export interface WorkspacePromptProfile {
  readonly namespace: string;
  readonly tone: readonly string[];
  readonly constraints: readonly string[];
}

export interface WorkspaceConfig {
  readonly workspaceType: WorkspaceType;
  readonly label: string;
  readonly contentTrack: 'retail' | 'recruitment' | (string & {});
  readonly themeKey: string;
  readonly templateNamespace: string;
  readonly promptProfile: WorkspacePromptProfile;
  readonly enabledCapabilities: readonly WorkspaceCapability[];
  readonly dashboard: WorkspaceCapabilityConfig;
  readonly crm: WorkspaceCapabilityConfig;
  readonly content: WorkspaceCapabilityConfig;
  readonly funnel: WorkspaceCapabilityConfig;
  readonly landing: WorkspaceCapabilityConfig;
  readonly analytics: WorkspaceCapabilityConfig;
  readonly ai: WorkspaceCapabilityConfig;
  readonly navigation: {
    readonly primaryWorkspaceRoute: string;
    readonly capabilityRoutes: Readonly<Record<WorkspaceCapability, string>>;
  };
}

export interface WorkspaceManifest {
  readonly workspaceType: WorkspaceType;
  readonly configuration: WorkspaceConfig;
}

export interface WorkspaceRegistryEntry {
  readonly workspaceType: WorkspaceType;
  readonly configuration: WorkspaceConfig;
}

export interface CapabilityRegistryEntry {
  readonly capability: WorkspaceCapability;
  readonly enabledByDefault: boolean;
  readonly requiredPermissions: readonly WorkspacePermission[];
}

export interface EngineContextSkeleton {
  readonly workspaceContext: WorkspaceContext;
  readonly templateNamespace: string;
  readonly promptNamespace: string;
  readonly capabilityRegistry: readonly CapabilityRegistryEntry[];
}

export interface WorkspaceContext {
  readonly workspaceId: WorkspaceId;
  readonly workspaceType: WorkspaceType;
  readonly memberId?: MemberId;
  readonly membership?: WorkspaceMembership;
  readonly role?: WorkspaceRole;
  readonly permissions: readonly WorkspacePermission[];
  readonly capabilities: readonly WorkspaceCapability[];
  readonly templateNamespace: string;
  readonly themeKey: string;
  readonly promptProfile: WorkspacePromptProfile;
  readonly activeWorkspaceId: WorkspaceId;
  readonly activeWorkspaceType: WorkspaceType;
  readonly activeMembership?: WorkspaceMembership;
  readonly workspaceConfig: WorkspaceConfig;
  readonly enabledCapabilities: readonly WorkspaceCapability[];
  readonly navigationContext: WorkspaceConfig['navigation'];
  readonly dashboardContext: WorkspaceCapabilityConfig;
  readonly crmContext: WorkspaceCapabilityConfig;
  readonly funnelContext: WorkspaceCapabilityConfig;
  readonly landingContext: WorkspaceCapabilityConfig;
  readonly contentContext: WorkspaceCapabilityConfig;
  readonly analyticsContext: WorkspaceCapabilityConfig;
  readonly aiContext: WorkspaceCapabilityConfig;
}

export interface ResolveWorkspaceContextInput {
  readonly tenantId: string;
  readonly workspaces?: readonly Workspace[];
  readonly memberships?: readonly WorkspaceMembership[];
  readonly memberId?: string | null;
  readonly preferredWorkspaceId?: string | null;
  readonly legacyWorkspaceType?: WorkspaceType;
}
