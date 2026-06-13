// ============================================================
// Brand DNA — Canonical Type Definitions
// Single source of truth for the entire NextShift OS identity layer.
// ============================================================

// ---- Identity ----
export interface BrandIdentity {
  brandName: string;
  personalName: string;
  brandPositioning: string;
  slogan: string;
}

// ---- Audience ----
export interface BrandAudience {
  targetAudience: string;
  audiencePainPoints: string[];
  audienceGoals: string[];
  audienceObjections: string[];
}

// ---- Messaging ----
export interface BrandMessaging {
  coreMessage: string;
  uniqueAngle: string;
  elevatorPitch: string;
}

// ---- Content ----
export interface BrandContent {
  contentTone: string;
  contentPillars: ContentPillar[];
  storytellingStyle: string;
}

export interface ContentPillar {
  name: string;
  emoji: string;
  percentage: number;
  description: string;
}

// ---- Offer ----
export interface BrandOffer {
  primaryOffer: string;
  secondaryOffer: string;
  transformationPromise: string;
}

// ---- Visual ----
export interface BrandVisual {
  brandColors: string[];
  profileImagePrompt: string;
  coverBannerPrompt: string;
}

// ---- Metadata ----
export interface BrandDNAMeta {
  confidenceScore: number;
  generatedAt: string;
  updatedAt: string;
  version: number;
  publishedAt: string | null;
}

// ---- Complete Brand DNA ----
export interface BrandDNA {
  identity: BrandIdentity;
  audience: BrandAudience;
  messaging: BrandMessaging;
  content: BrandContent;
  offer: BrandOffer;
  visual: BrandVisual;
  meta: BrandDNAMeta;
}

// ---- Brand DNA Snapshot (for versioning) ----
export interface BrandDNASnapshot {
  version: number;
  snapshot: BrandDNA;
  createdAt: string;
  label?: string;
}

// ---- Context (what AI modules consume) ----
export interface BrandContext {
  positioning: string;
  audience: string;
  audiencePainPoints: string[];
  messaging: {
    coreMessage: string;
    uniqueAngle: string;
    elevatorPitch: string;
  };
  contentPillars: ContentPillar[];
  offer: {
    primary: string;
    transformation: string;
  };
  tone: string;
  visualIdentity: {
    colors: string[];
    imagePrompt: string;
    bannerPrompt: string;
  };
  personalName: string;
  brandName: string;
}

// ---- Health Score ----
export interface DNAHealthScore {
  identityClarity: number;
  audienceClarity: number;
  messagingClarity: number;
  contentClarity: number;
  offerClarity: number;
  visualClarity: number;
  overallScore: number;
  missingFields: string[];
  recommendations: string[];
}

// ---- Defaults ----
export const EMPTY_BRAND_DNA: BrandDNA = {
  identity: {
    brandName: '',
    personalName: '',
    brandPositioning: '',
    slogan: '',
  },
  audience: {
    targetAudience: '',
    audiencePainPoints: [],
    audienceGoals: [],
    audienceObjections: [],
  },
  messaging: {
    coreMessage: '',
    uniqueAngle: '',
    elevatorPitch: '',
  },
  content: {
    contentTone: '温暖亲切',
    contentPillars: [],
    storytellingStyle: '',
  },
  offer: {
    primaryOffer: '',
    secondaryOffer: '',
    transformationPromise: '',
  },
  visual: {
    brandColors: ['#2563eb', '#1e40af', '#f59e0b'],
    profileImagePrompt: '',
    coverBannerPrompt: '',
  },
  meta: {
    confidenceScore: 0,
    generatedAt: '',
    updatedAt: '',
    version: 1,
    publishedAt: null,
  },
};

// ---- Mapping from legacy brand_profile JSON ----
export function mapLegacyProfileToDNA(profile: Record<string, unknown> | null): BrandDNA {
  if (!profile) return { ...EMPTY_BRAND_DNA };

  const now = new Date().toISOString();

  return {
    identity: {
      brandName: (profile.brandName as string) ?? (profile.identity as string) ?? '',
      personalName: (profile.personalName as string) ?? '',
      brandPositioning: (profile.positioning as string) ?? (profile.brandPositioning as string) ?? '',
      slogan: (profile.slogan as string) ?? '',
    },
    audience: {
      targetAudience: (profile.target_audience as string) ?? (profile.targetAudience as string) ?? '',
      audiencePainPoints: Array.isArray(profile.audience_pain_points) ? profile.audience_pain_points as string[] : [],
      audienceGoals: Array.isArray(profile.audienceGoals) ? profile.audienceGoals as string[] : [],
      audienceObjections: Array.isArray(profile.audienceObjections) ? profile.audienceObjections as string[] : [],
    },
    messaging: {
      coreMessage: (profile.coreMessage as string) ?? (profile.value_proposition as string) ?? '',
      uniqueAngle: (profile.differentiator as string) ?? (profile.uniqueAngle as string) ?? '',
      elevatorPitch: (profile.elevatorPitch as string) ?? '',
    },
    content: {
      contentTone: (profile.contentTone as string) ?? (profile.personality as string) ?? '温暖亲切',
      contentPillars: Array.isArray(profile.content_pillars)
        ? profile.content_pillars as ContentPillar[]
        : [],
      storytellingStyle: (profile.storytellingStyle as string) ?? '',
    },
    offer: {
      primaryOffer: (profile.primaryOffer as string) ?? '',
      secondaryOffer: (profile.secondaryOffer as string) ?? '',
      transformationPromise: (profile.transformationPromise as string) ?? (profile.value_proposition as string) ?? '',
    },
    visual: {
      brandColors: Array.isArray(profile.brandColors) ? profile.brandColors as string[] : ['#2563eb', '#1e40af', '#f59e0b'],
      profileImagePrompt: (profile.profileImagePrompt as string) ?? '',
      coverBannerPrompt: (profile.coverBannerPrompt as string) ?? '',
    },
    meta: {
      confidenceScore: (profile.confidenceScore as number) ?? 0,
      generatedAt: (profile.generatedAt as string) ?? now,
      updatedAt: now,
      version: (profile.version as number) ?? 1,
      publishedAt: (profile.publishedAt as string) ?? null,
    },
  };
}
