import type { UserLevel as EvolutionLevel } from '../types/evolution.types';
import type { EvolutionSnapshot } from '@/modules/evolution/types/evolution-snapshot';

const LEGACY_UNLOCKS_BY_LEVEL: Record<EvolutionLevel, string[]> = {
  explorer: ['brand-builder', 'journey', 'ai-coach'],
  builder: ['brand-builder', 'journey', 'ai-coach', 'content-engine', 'lead-magnet', 'content-analytics'],
  operator: ['brand-builder', 'journey', 'ai-coach', 'content-engine', 'lead-magnet', 'content-analytics', 'crm', 'sales-engine', 'revenue-dashboard', 'follow-up-system'],
  leader: ['brand-builder', 'journey', 'ai-coach', 'content-engine', 'lead-magnet', 'content-analytics', 'crm', 'sales-engine', 'revenue-dashboard', 'follow-up-system', 'team-center', 'automation-engine', 'advanced-analytics', 'funnel-intelligence'],
};

const MODULE_LEVELS: Record<string, EvolutionLevel> = {
  'brand-builder': 'explorer',
  journey: 'explorer',
  'ai-coach': 'explorer',
  'content-engine': 'builder',
  'lead-magnet': 'builder',
  'content-analytics': 'builder',
  crm: 'operator',
  'sales-engine': 'operator',
  'revenue-dashboard': 'operator',
  'follow-up-system': 'operator',
  'team-center': 'leader',
  'automation-engine': 'leader',
  'advanced-analytics': 'leader',
  'funnel-intelligence': 'leader',
};

const LEVEL_ORDER: Record<EvolutionLevel, number> = {
  explorer: 0,
  builder: 1,
  operator: 2,
  leader: 3,
};

const LEVEL_TO_STAGE: Record<EvolutionLevel, EvolutionSnapshot['currentStage']> = {
  explorer: 'brand_foundation',
  builder: 'content_creation',
  operator: 'customer_acquisition',
  leader: 'team_scaling',
};

export function mapCompletedChecksToLegacyMilestones(completedChecks: string[]): string[] {
  return Array.from(new Set(completedChecks));
}

export function getLegacyUnlockedModules(level: EvolutionLevel): string[] {
  return LEGACY_UNLOCKS_BY_LEVEL[level];
}

export function isLegacyModuleUnlocked(moduleId: string, level: EvolutionLevel): boolean {
  const requiredLevel = MODULE_LEVELS[moduleId];
  if (!requiredLevel) return true;
  return LEVEL_ORDER[level] >= LEVEL_ORDER[requiredLevel];
}

export function getLegacyLockedReason(moduleId: string, level: EvolutionLevel): string | null {
  const requiredLevel = MODULE_LEVELS[moduleId];
  if (!requiredLevel) return null;
  if (isLegacyModuleUnlocked(moduleId, level)) return null;
  return `🔒 Unlock at ${requiredLevel.charAt(0).toUpperCase()}${requiredLevel.slice(1)} Level`;
}

export function buildLegacyEvolutionSnapshot(input: {
  level: EvolutionLevel;
  progressPercentage: number;
  completedMilestones: string[];
  unlockedModules: string[];
  nextMilestone: string;
}): EvolutionSnapshot {
  return {
    level: input.level,
    progressPercentage: input.progressPercentage,
    currentStage: LEVEL_TO_STAGE[input.level],
    nextLevel: input.level === 'explorer' ? 'builder' : input.level === 'builder' ? 'operator' : input.level === 'operator' ? 'leader' : null,
    unlockedModules: input.unlockedModules as EvolutionSnapshot['unlockedModules'],
    completedMissions: input.completedMilestones.length,
    totalMissions: Math.max(input.completedMilestones.length, 7),
  };
}
