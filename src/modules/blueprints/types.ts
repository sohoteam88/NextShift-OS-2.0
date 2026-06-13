import type { FunnelType } from '@/modules/funnel-context/types';

export interface BlueprintDefinition {
  id: string; name: string; description: string; category: string; version: string;
  supportedFunnels: FunnelType[];
  supportedLanguages: string[];
  installSteps: string[];
  brandDNA: {
    brandPositioning: string; targetAudience: string; contentTone: string;
    primaryOffer: string; slogan: string; brandColors: string[];
  };
  funnels: Record<FunnelType, BlueprintFunnelConfig>;
  automationTemplates: string[];
  crmPipelines: Record<FunnelType, string[]>;
  whatsappScripts: Record<FunnelType, Array<{ trigger: string; reply: string }>>;
}

export interface BlueprintFunnelConfig {
  leadMagnetTitle: string; leadMagnetPromise: string;
  contentPillars: Array<{ name: string; emoji: string; percentage: number; description: string }>;
  videoThemes: string[];
  cta: string; webinarTheme: string;
}

export interface BlueprintInstallState {
  blueprintId: string; installedAt: string; status: 'installing' | 'installed';
  activatedFunnels: FunnelType[];
  brandDNAGenerated: boolean;
}
