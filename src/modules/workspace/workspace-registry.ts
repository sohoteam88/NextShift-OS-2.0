import type {
  WorkspaceCapability,
  WorkspaceCapabilityConfig,
  WorkspaceConfig,
  WorkspaceManifest,
  WorkspaceAIProfile,
  WorkspaceDashboardWidget,
  WorkspaceNavigationItem,
  WorkspacePromptProfile,
  WorkspaceTemplateDefinition,
  WorkspaceType,
} from './types';
import { getWorkspaceManifest, WORKSPACE_MANIFEST_REGISTRY } from './workspace-config';

export class WorkspaceRegistry {
  constructor(
    private readonly manifests: Readonly<Record<string, WorkspaceManifest>> = WORKSPACE_MANIFEST_REGISTRY,
  ) {}

  getManifest(workspaceType: WorkspaceType): WorkspaceManifest {
    return this.manifests[workspaceType] ?? getWorkspaceManifest(workspaceType);
  }

  getConfiguration(workspaceType: WorkspaceType): WorkspaceConfig {
    return this.getManifest(workspaceType).configuration;
  }

  getNavigation(workspaceType: WorkspaceType): WorkspaceConfig['navigation'] {
    return this.getConfiguration(workspaceType).navigation;
  }

  getNavigationItems(workspaceType: WorkspaceType): readonly WorkspaceNavigationItem[] {
    return this.getConfiguration(workspaceType).navigation.items ?? [];
  }

  getDashboardProfile(workspaceType: WorkspaceType): WorkspaceCapabilityConfig {
    return this.getConfiguration(workspaceType).dashboard;
  }

  getDashboardWidgets(workspaceType: WorkspaceType): readonly WorkspaceDashboardWidget[] {
    return this.getConfiguration(workspaceType).dashboardWidgets ?? [];
  }

  getCapabilityProfile(
    workspaceType: WorkspaceType,
    capability: WorkspaceCapability,
  ): WorkspaceCapabilityConfig {
    const configuration = this.getConfiguration(workspaceType);
    if (capability === 'ai_coach') return configuration.ai;
    return configuration[capability];
  }

  getThemeKey(workspaceType: WorkspaceType): string {
    return this.getConfiguration(workspaceType).themeKey;
  }

  getTemplateNamespace(workspaceType: WorkspaceType): string {
    return this.getConfiguration(workspaceType).templateNamespace;
  }

  getPromptProfile(workspaceType: WorkspaceType): WorkspacePromptProfile {
    return this.getConfiguration(workspaceType).promptProfile;
  }

  getAIProfile(workspaceType: WorkspaceType): WorkspaceAIProfile | null {
    return this.getConfiguration(workspaceType).aiProfile ?? null;
  }

  getAICOOProfile(workspaceType: WorkspaceType): WorkspaceAIProfile | null {
    return this.getConfiguration(workspaceType).aiCooProfile ?? null;
  }

  getTemplates(workspaceType: WorkspaceType): readonly WorkspaceTemplateDefinition[] {
    return this.getConfiguration(workspaceType).templates ?? [];
  }

  getBusinessCapabilities(workspaceType: WorkspaceType): readonly string[] {
    return this.getConfiguration(workspaceType).businessCapabilities ?? [];
  }
}

export const defaultWorkspaceRegistry = new WorkspaceRegistry();
