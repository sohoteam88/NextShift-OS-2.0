import type { EvolutionLevel, EvolutionModule } from '../types/evolution-snapshot';

const RAW_TO_CANONICAL_MODULES: Array<{ raw: string; canonical: EvolutionModule }> = [
  { raw: 'brand-builder', canonical: 'brand-builder' },
  { raw: 'journey', canonical: 'journey' },
  { raw: 'ai-coach', canonical: 'dashboard' },
  { raw: 'content-engine', canonical: 'content-engine' },
  { raw: 'lead-magnet', canonical: 'lead-engine' },
  { raw: 'lead-magnet-builder', canonical: 'lead-engine' },
  { raw: 'crm', canonical: 'crm' },
  { raw: 'sales-engine', canonical: 'sales' },
  { raw: 'revenue-dashboard', canonical: 'sales' },
  { raw: 'follow-up-system', canonical: 'sales' },
  { raw: 'team-center', canonical: 'team' },
  { raw: 'automation-engine', canonical: 'team' },
  { raw: 'advanced-analytics', canonical: 'team' },
  { raw: 'funnel-intelligence', canonical: 'team' },
];

const LEGACY_UNLOCKS_BY_LEVEL: Record<EvolutionLevel, string[]> = {
  explorer: ['brand-builder', 'journey', 'ai-coach'],
  builder: ['brand-builder', 'journey', 'ai-coach', 'content-engine', 'lead-magnet', 'content-analytics'],
  operator: ['brand-builder', 'journey', 'ai-coach', 'content-engine', 'lead-magnet', 'content-analytics', 'crm', 'sales-engine', 'revenue-dashboard', 'follow-up-system'],
  leader: ['brand-builder', 'journey', 'ai-coach', 'content-engine', 'lead-magnet', 'content-analytics', 'crm', 'sales-engine', 'revenue-dashboard', 'follow-up-system', 'team-center', 'automation-engine', 'advanced-analytics', 'funnel-intelligence'],
};

export function deriveUnlocks(level: EvolutionLevel): EvolutionModule[] {
  const canonical = new Set<EvolutionModule>(['dashboard', 'journey']);

  for (const rawModule of LEGACY_UNLOCKS_BY_LEVEL[level]) {
    const mapped = RAW_TO_CANONICAL_MODULES.find((item) => item.raw === rawModule)?.canonical;
    if (mapped) canonical.add(mapped);
  }

  return [...canonical];
}
