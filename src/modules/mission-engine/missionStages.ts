// ============================================================
// Mission Stage Definition Layer
// Defines the full beginner & advanced journey for the V3 Mission Engine.
// Extends the existing journey-map.ts with mode-aware stages.
// ============================================================

export type MissionMode = 'beginner' | 'advanced' | 'both';

export type MissionStageId =
  | 'account_approved'
  | 'brand_discovery'
  | 'brand_dna'
  | 'social_setup'
  | 'first_bio'
  | 'first_content'
  | 'first_video'
  | 'lead_magnet'
  | 'webinar'
  | 'funnel'
  | 'traffic_campaign'
  | 'whatsapp_followup'
  | 'crm_setup'
  | 'first_sale'
  | 'growth_mode';

export interface MissionStage {
  /** Unique stage identifier */
  id: MissionStageId;
  /** Display title (trilingual supported via i18n keys) */
  title: string;
  /** Short action-oriented description of what the user does */
  description: string;
  /** Why completing this stage matters for the user's business */
  whyItMatters: string;
  /** Estimated time to complete this stage in minutes */
  estimatedMinutes: number;
  /** Route the user is sent to for completing this stage */
  route: string;
  /** XP awarded on completion */
  xp: number;
  /** Which mode(s) this stage appears in */
  mode: MissionMode;
  /** Whether completing this stage unlocks the next one */
  unlocksNextStage: boolean;
  /** Ordinal position in the sequence (1-based) */
  order: number;
  /** Backward-compatible completion check key */
  completionCheck: string;
}

// ============================================================
// Beginner Journey — 15 stages, linear progression
// ============================================================

export const BEGINNER_STAGES: MissionStage[] = [
  {
    id: 'account_approved',
    title: 'Account Approved',
    description: 'Your account has been reviewed and approved. You are now ready to begin your brand journey.',
    whyItMatters: 'Without account approval, you cannot access the platform. This step confirms you are a verified member.',
    estimatedMinutes: 0,
    route: '/dashboard',
    xp: 10,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 1,
    completionCheck: 'account_approved',
  },
  {
    id: 'brand_discovery',
    title: 'Brand Discovery',
    description: 'Tell AI your story through a guided interview — your background, passion, and why you do what you do.',
    whyItMatters: 'Your brand starts with your story. AI extracts your unique positioning from this conversation, which becomes the foundation for everything you build.',
    estimatedMinutes: 15,
    route: '/brand-builder/step/interview',
    xp: 50,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 2,
    completionCheck: 'brand_discovery_completed',
  },
  {
    id: 'brand_dna',
    title: 'Brand DNA',
    description: 'Review and confirm the AI-generated brand profile: your positioning, story, target audience, and value proposition.',
    whyItMatters: 'A clear brand DNA ensures every piece of content, every funnel, and every customer interaction speaks with one consistent voice.',
    estimatedMinutes: 10,
    route: '/brand-builder/step/profile',
    xp: 50,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 3,
    completionCheck: 'brand_dna_confirmed',
  },
  {
    id: 'social_setup',
    title: 'Social Profile Setup',
    description: 'Generate your social username, platform bios, avatar guidance, and profile direction from Brand DNA.',
    whyItMatters: 'Your social profile is the public face of your Brand DNA. Content, funnel CTA, and platform setup should all reuse the same profile assets.',
    estimatedMinutes: 8,
    route: '/brand-builder/step/accounts',
    xp: 30,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 4,
    completionCheck: 'social_setup_completed',
  },
  {
    id: 'first_bio',
    title: 'Profile Bio Ready',
    description: 'Confirm the bio copy that will appear on your social profiles and funnel CTA.',
    whyItMatters: 'Your bio is the first thing people read. A strong bio turns a scroller into a follower and a follower into a lead.',
    estimatedMinutes: 3,
    route: '/brand-builder/step/accounts',
    xp: 20,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 5,
    completionCheck: 'first_bio_completed',
  },
  {
    id: 'first_content',
    title: 'First Content Piece',
    description: 'AI generates your first social media post based on your brand DNA — hook, body, and call-to-action.',
    whyItMatters: 'Content is how you attract. Your first post breaks the ice and puts your brand in front of real people.',
    estimatedMinutes: 8,
    route: '/content-engine',
    xp: 25,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 6,
    completionCheck: 'first_content_generated',
  },
  {
    id: 'first_video',
    title: 'First Video Script',
    description: 'Generate a short-form video script with hook, scenes, and copy optimized for TikTok/Reels.',
    whyItMatters: 'Video is the fastest-growing format. A single well-scripted video can reach thousands and bring your first leads.',
    estimatedMinutes: 10,
    route: '/video/new',
    xp: 25,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 7,
    completionCheck: 'first_video_generated',
  },
  {
    id: 'lead_magnet',
    title: 'Build Your Lead Magnet',
    description: 'Create a free valuable resource (checklist, guide, or mini-course) that people exchange their contact info for.',
    whyItMatters: 'A lead magnet turns anonymous visitors into contacts you can follow up with. This is where your funnel begins.',
    estimatedMinutes: 15,
    route: '/funnel',
    xp: 35,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 8,
    completionCheck: 'lead_magnet_created',
  },
  {
    id: 'webinar',
    title: 'Set Up Your Webinar',
    description: 'Build an automated or live webinar that demonstrates your expertise and makes your offer irresistible.',
    whyItMatters: 'A webinar is the highest-converting sales tool in online business. It builds trust at scale and closes sales while you sleep.',
    estimatedMinutes: 30,
    route: '/funnel',
    xp: 40,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 9,
    completionCheck: 'webinar_created',
  },
  {
    id: 'funnel',
    title: 'Launch Your Funnel',
    description: 'Connect your lead magnet and webinar into a complete automated sales funnel.',
    whyItMatters: 'A funnel is your 24/7 sales machine. Once built, it works continuously — capturing leads, delivering value, and converting customers.',
    estimatedMinutes: 20,
    route: '/funnel',
    xp: 50,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 10,
    completionCheck: 'funnel_published',
  },
  {
    id: 'traffic_campaign',
    title: 'Launch Traffic Campaign',
    description: 'Push your funnel to real audiences through targeted ads or organic content strategy.',
    whyItMatters: 'A funnel without traffic is like a shop with no road. This step puts your offer in front of people who need it.',
    estimatedMinutes: 20,
    route: '/traffic-engine',
    xp: 35,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 11,
    completionCheck: 'traffic_campaign_launched',
  },
  {
    id: 'whatsapp_followup',
    title: 'WhatsApp AI Follow-Up',
    description: 'Set up AI-powered WhatsApp auto-replies and follow-up sequences for incoming leads.',
    whyItMatters: 'Speed wins. Responding within 5 minutes instead of 5 hours can 10x your conversion rate. AI makes this possible.',
    estimatedMinutes: 15,
    route: '/crm',
    xp: 30,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 12,
    completionCheck: 'whatsapp_followup_configured',
  },
  {
    id: 'crm_setup',
    title: 'CRM Setup',
    description: 'Organize your leads, track pipeline stages, and never lose a follow-up again.',
    whyItMatters: 'As leads come in, organization becomes critical. CRM ensures every lead is tracked, scored, and followed up on time.',
    estimatedMinutes: 10,
    route: '/crm/pipeline',
    xp: 25,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 13,
    completionCheck: 'crm_setup_completed',
  },
  {
    id: 'first_sale',
    title: 'First Sale',
    description: 'Close your first customer through the system you built and mark the deal as won.',
    whyItMatters: 'This is the milestone that separates builders from business owners. Your first sale proves the entire system works.',
    estimatedMinutes: 0,
    route: '/sales',
    xp: 100,
    mode: 'beginner',
    unlocksNextStage: true,
    order: 14,
    completionCheck: 'first_sale_completed',
  },
  {
    id: 'growth_mode',
    title: 'Growth Mode',
    description: 'You have built the core system. Now scale: more content, more traffic, more team members, more sales.',
    whyItMatters: 'You have graduated from setup to scale. The same system that got your first sale can get you your 100th — now you repeat and optimize.',
    estimatedMinutes: 0,
    route: '/dashboard',
    xp: 100,
    mode: 'both',
    unlocksNextStage: false,
    order: 15,
    completionCheck: 'growth_mode_active',
  },
];

// ============================================================
// Advanced Stages — Additional optional stages for advanced mode
// ============================================================

export const ADVANCED_STAGES: MissionStage[] = [
  {
    id: 'brand_discovery',
    title: 'Brand Discovery (Advanced)',
    description: 'Deep-dive brand interview with multi-modal AI analysis including voice tone, sentiment, and market gap detection.',
    whyItMatters: 'Advanced brand discovery uncovers hidden positioning angles your competitors have missed.',
    estimatedMinutes: 25,
    route: '/brand-builder/step/interview?mode=advanced',
    xp: 75,
    mode: 'advanced',
    unlocksNextStage: true,
    order: 2,
    completionCheck: 'brand_discovery_completed',
  },
];

// ============================================================
// All stages combined
// ============================================================

export const ALL_STAGES: MissionStage[] = [...BEGINNER_STAGES];

// ============================================================
// Lookup & Utility Functions
// ============================================================

export function getStageById(id: MissionStageId): MissionStage | undefined {
  return ALL_STAGES.find((s) => s.id === id);
}

export function getStageByOrder(order: number): MissionStage | undefined {
  return ALL_STAGES.find((s) => s.order === order);
}

export function getStagesForMode(mode: 'beginner' | 'advanced'): MissionStage[] {
  return ALL_STAGES.filter((s) => s.mode === mode || s.mode === 'both');
}

/**
 * Returns the next stage the user should complete based on their completed
 * check keys. Respects the stage order and the unlocksNextStage flag.
 */
export function getNextStage(completedCheckKeys: string[]): MissionStage | null {
  const completedSet = new Set(completedCheckKeys);

  for (const stage of ALL_STAGES) {
    if (completedSet.has(stage.completionCheck)) continue;

    // Find the previous stage (one with order = stage.order - 1)
    const prevStage = getStageByOrder(stage.order - 1);

    // If there's no previous stage (first stage), it's unlocked
    if (!prevStage) return stage;

    // If the previous stage unlocks the next and it's completed, this one is unlocked
    if (prevStage.unlocksNextStage && completedSet.has(prevStage.completionCheck)) {
      return stage;
    }

    // If the previous stage doesn't unlock next, skip chain logic
    // (handles edge cases where stages might be non-linear)
  }

  return null;
}

/**
 * Calculate progress percentage based on completed stages.
 */
export function getProgressPercent(completedCheckKeys: string[]): number {
  const activeStages = ALL_STAGES.filter((s) => s.id !== 'account_approved');
  const completed = activeStages.filter((s) => completedCheckKeys.includes(s.completionCheck)).length;
  return Math.round((completed / activeStages.length) * 100);
}

/**
 * Calculate total XP earned from completed stages.
 */
export function getTotalXP(completedCheckKeys: string[]): number {
  return ALL_STAGES
    .filter((s) => completedCheckKeys.includes(s.completionCheck))
    .reduce((sum, s) => sum + s.xp, 0);
}

/**
 * Calculate the stage number (1-based) for display purposes.
 */
export function getStageNumber(stage: MissionStage): number {
  return stage.order;
}

/**
 * Total number of user stages (excluding account_approved).
 */
export function getTotalStages(): number {
  return ALL_STAGES.filter((s) => s.id !== 'account_approved').length;
}

/**
 * Estimated cumulative minutes remaining from current position.
 */
export function estimateMinutesRemaining(
  completedCheckKeys: string[],
  targetCheck?: string,
): number {
  let remaining = 0;
  const completedSet = new Set(completedCheckKeys);

  for (const stage of ALL_STAGES) {
    if (completedSet.has(stage.completionCheck)) continue;
    remaining += stage.estimatedMinutes;
    if (targetCheck && stage.completionCheck === targetCheck) break;
  }

  return remaining;
}
