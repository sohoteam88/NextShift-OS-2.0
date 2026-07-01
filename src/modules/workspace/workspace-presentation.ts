import type {
  WorkspaceAIProfile,
  WorkspaceDashboardWidget,
  WorkspaceNavigationItem,
  WorkspaceTemplateDefinition,
  WorkspaceType,
} from './types';
import { defaultWorkspaceRegistry } from './workspace-registry';

export interface WorkspacePresentationModel {
  readonly workspaceType: WorkspaceType;
  readonly workspaceName: string;
  readonly navigationItems: readonly WorkspaceNavigationItem[];
  readonly dashboardWidgets: readonly WorkspaceDashboardWidget[];
  readonly templates: readonly WorkspaceTemplateDefinition[];
  readonly businessCapabilities: readonly string[];
  readonly aiProfile: WorkspaceAIProfile | null;
  readonly aiCooProfile: WorkspaceAIProfile | null;
}

function byPriority<T extends { readonly priority?: number; readonly id: string }>(a: T, b: T) {
  return (a.priority ?? 0) - (b.priority ?? 0) || a.id.localeCompare(b.id);
}

export function getWorkspacePresentationModel(workspaceType: WorkspaceType): WorkspacePresentationModel {
  const configuration = defaultWorkspaceRegistry.getConfiguration(workspaceType);

  return {
    workspaceType,
    workspaceName: configuration.workspaceName,
    navigationItems: [...defaultWorkspaceRegistry.getNavigationItems(workspaceType)].sort(byPriority),
    dashboardWidgets: defaultWorkspaceRegistry.getDashboardWidgets(workspaceType),
    templates: defaultWorkspaceRegistry.getTemplates(workspaceType),
    businessCapabilities: defaultWorkspaceRegistry.getBusinessCapabilities(workspaceType),
    aiProfile: defaultWorkspaceRegistry.getAIProfile(workspaceType),
    aiCooProfile: defaultWorkspaceRegistry.getAICOOProfile(workspaceType),
  };
}
