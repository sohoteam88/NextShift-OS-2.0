// Follow-Up Engine — ensures no lead is forgotten

import type { FollowUpItem, FollowUpStatus } from '../types/crm.types';

const DEFAULT_SCHEDULE_DAYS = [1, 3, 7, 14, 30];

const items: FollowUpItem[] = [];

export function createFollowUp(leadId: string, leadName: string, description: string, dueDate?: string): FollowUpItem {
  const item: FollowUpItem = {
    id: `fu-${Date.now()}`, leadId, leadName,
    dueDate: dueDate ?? new Date(Date.now() + DEFAULT_SCHEDULE_DAYS[0] * 86400000).toISOString(),
    status: 'pending', description,
  };
  items.push(item);
  return item;
}

export function getDueFollowUps(): FollowUpItem[] {
  const now = new Date().toISOString();
  return items.filter(i => i.status === 'pending' && i.dueDate <= now);
}

export function getOverdueFollowUps(): FollowUpItem[] {
  const now = new Date().toISOString();
  return items.filter(i => i.status !== 'completed' && i.dueDate < now);
}

export function completeFollowUp(id: string): void {
  const item = items.find(i => i.id === id);
  if (item) item.status = 'completed';
}

export function getFollowUpStats() {
  return {
    due: getDueFollowUps().length,
    overdue: getOverdueFollowUps().length,
    completed: items.filter(i => i.status === 'completed').length,
  };
}
