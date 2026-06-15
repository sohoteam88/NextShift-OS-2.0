// Module Unlock Engine — controls feature access by user level

import type { UserLevel } from '../types/evolution.types';

const MODULE_UNLOCKS: Record<string, { level: UserLevel; label: string }> = {
  'brand-builder': { level: 'explorer', label: 'Brand Builder' },
  journey: { level: 'explorer', label: 'Journey' },
  'ai-coach': { level: 'explorer', label: 'AI Coach' },
  'content-engine': { level: 'builder', label: 'Content Engine' },
  'lead-magnet': { level: 'builder', label: 'Lead Magnet Builder' },
  'content-analytics': { level: 'builder', label: 'Content Analytics' },
  crm: { level: 'operator', label: 'CRM' },
  'sales-engine': { level: 'operator', label: 'Sales Engine' },
  'revenue-dashboard': { level: 'operator', label: 'Revenue Dashboard' },
  'follow-up-system': { level: 'operator', label: 'Follow-Up System' },
  'team-center': { level: 'leader', label: 'Team Center' },
  'automation-engine': { level: 'leader', label: 'Automation Engine' },
  'advanced-analytics': { level: 'leader', label: 'Advanced Analytics' },
  'funnel-intelligence': { level: 'leader', label: 'Funnel Intelligence' },
};

const LEVEL_ORDER: Record<UserLevel, number> = { explorer: 0, builder: 1, operator: 2, leader: 3 };

export function getUnlockedModules(level: UserLevel): string[] {
  return Object.entries(MODULE_UNLOCKS)
    .filter(([, info]) => LEVEL_ORDER[level] >= LEVEL_ORDER[info.level])
    .map(([key]) => key);
}

export function isModuleUnlocked(moduleId: string, level: UserLevel): boolean {
  const info = MODULE_UNLOCKS[moduleId];
  if (!info) return true; // unknown modules default to unlocked
  return LEVEL_ORDER[level] >= LEVEL_ORDER[info.level];
}

export function getLockedReason(moduleId: string, level: UserLevel): string | null {
  const info = MODULE_UNLOCKS[moduleId];
  if (!info) return null;
  if (isModuleUnlocked(moduleId, level)) return null;
  return `🔒 Unlock at ${info.level.charAt(0).toUpperCase() + info.level.slice(1)} Level`;
}
