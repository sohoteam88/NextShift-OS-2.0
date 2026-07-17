export type AnalyticsCapabilityView = 'overview' | 'role';
export type BrandCapabilityView = 'profile' | 'discovery' | 'dna';
export type CrmCapabilityView = 'mission' | 'dashboard' | 'leads' | 'sales';
export type FunnelCapabilityView = 'builder' | 'context';
export type VideoCapabilityView = 'projects' | 'production';
export type AnalyticsPeriod = '7d' | '30d' | '90d';

function scalar(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function memberOf<const T extends readonly string[]>(value: string | undefined, allowed: T, fallback: T[number]) {
  return allowed.includes(value ?? '') ? (value as T[number]) : fallback;
}

export function resolveAnalyticsView(value: string | string[] | null | undefined): AnalyticsCapabilityView {
  return memberOf(scalar(value), ['overview', 'role'] as const, 'overview');
}

export function resolveBrandView(value: string | string[] | null | undefined): BrandCapabilityView {
  return memberOf(scalar(value), ['profile', 'discovery', 'dna'] as const, 'profile');
}

export function resolveCrmView(value: string | string[] | null | undefined): CrmCapabilityView {
  return memberOf(scalar(value), ['mission', 'dashboard', 'leads', 'sales'] as const, 'mission');
}

export function resolveFunnelView(value: string | string[] | null | undefined): FunnelCapabilityView {
  return memberOf(scalar(value), ['builder', 'context'] as const, 'builder');
}

export function resolveVideoView(value: string | string[] | null | undefined): VideoCapabilityView {
  return memberOf(scalar(value), ['projects', 'production'] as const, 'projects');
}

export function resolveAnalyticsPeriod(value: string | string[] | null | undefined): AnalyticsPeriod {
  return memberOf(scalar(value), ['7d', '30d', '90d'] as const, '30d');
}
