// ============================================================
// Centralized React Query Key Factory
// Single source of truth for all query keys.
// Usage: queryKeys.mission.state() → ['mission', 'state']
// Invalidation: queryClient.invalidateQueries({ queryKey: queryKeys.mission.all() })
// ============================================================

export const queryKeys = {
  // ---- Mission Engine ----
  mission: {
    all: () => ['mission'] as const,
    state: () => ['mission', 'state'] as const,
    journey: () => ['mission', 'journey'] as const,
    achievements: () => ['mission', 'achievements'] as const,
    engine: {
      current: () => ['mission-engine', 'current'] as const,
    },
  },

  // ---- Brand Discovery & DNA ----
  brand: {
    all: () => ['brand-dna'] as const,
    health: () => ['brand-dna', 'health'] as const,
    discovery: () => ['brand-discovery'] as const,
    interview: () => ['brand-discovery', 'interview'] as const,
  },

  // ---- Social Setup ----
  social: {
    all: () => ['social-setup'] as const,
  },

  // ---- Content Engine ----
  content: {
    all: () => ['content-engine'] as const,
    today: () => ['brand-builder', 'calendar', 'today'] as const,
  },

  // ---- Video Production ----
  video: {
    all: () => ['video-engine'] as const,
  },

  // ---- Lead Magnet ----
  leadMagnet: {
    all: () => ['lead-magnet'] as const,
  },

  // ---- Webinar Center ----
  webinar: {
    all: () => ['webinar'] as const,
  },

  // ---- Funnel Builder ----
  funnel: {
    all: () => ['funnel-builder'] as const,
  },

  // ---- Traffic Engine ----
  traffic: {
    all: () => ['traffic-engine'] as const,
  },

  // ---- WhatsApp AI ----
  whatsapp: {
    all: () => ['whatsapp-ai'] as const,
  },

  // ---- CRM ----
  crm: {
    all: () => ['crm-center'] as const,
    stats: () => ['crm-stats'] as const,
  },

  // ---- Analytics ----
  analytics: {
    all: () => ['analytics-center'] as const,
  },

  // ---- SaaS ----
  saas: {
    all: () => ['saas'] as const,
  },

  // ---- Admin ----
  admin: {
    all: () => ['admin-command'] as const,
  },

  // ---- AI ----
  ai: {
    content: () => ['ai-content'] as const,
    history: () => ['ai-content-history'] as const,
    coach: () => ['ai-coach'] as const,
  },

  // ---- Brand Builder legacy ----
  brandBuilder: {
    calendar: () => ['brand-builder', 'calendar'] as const,
    calendarToday: () => ['brand-builder', 'calendar', 'today'] as const,
    calendarStats: () => ['brand-builder', 'calendar', 'stats'] as const,
  },
} as const;
