import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';

export interface BlueprintDefinition {
  id: string; name: string; description: string; category: string; version: string;
  supportedFunnels: BusinessFunnelType[];
  supportedLanguages: string[];
  installSteps: string[];
  brandDNA: {
    brandPositioning: string; targetAudience: string; contentTone: string;
    primaryOffer: string; slogan: string; brandColors: string[];
  };
  funnels: Record<BusinessFunnelType, BlueprintFunnelConfig>;
  automationTemplates: string[];
  crmPipelines: Record<BusinessFunnelType, string[]>;
  whatsappScripts: Record<BusinessFunnelType, Array<{ trigger: string; reply: string }>>;
}

export interface BlueprintFunnelConfig {
  leadMagnetTitle: string; leadMagnetPromise: string;
  contentPillars: Array<{ name: string; emoji: string; percentage: number; description: string }>;
  videoThemes: string[];
  cta: string; webinarTheme: string;
}

export interface BlueprintInstallState {
  blueprintId: string; installedAt: string; status: 'installing' | 'installed';
  activatedFunnels: BusinessFunnelType[];
  brandDNAGenerated: boolean;
}
