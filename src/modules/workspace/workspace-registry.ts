import type {
  WorkspaceCapability,
  WorkspaceCapabilityConfig,
  WorkspaceConfig,
  WorkspaceManifest,
  WorkspacePromptProfile,
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

  getDashboardProfile(workspaceType: WorkspaceType): WorkspaceCapabilityConfig {
    return this.getConfiguration(workspaceType).dashboard;
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
}

export const defaultWorkspaceRegistry = new WorkspaceRegistry();
