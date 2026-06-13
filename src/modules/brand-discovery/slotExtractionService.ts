// ============================================================
// Slot Extraction Engine
// Extracts 6 brand-discovery slots from conversation.
// Modularized from brand-interview-service.ts.
// ============================================================

export type SlotStatus = 'empty' | 'partial' | 'filled' | 'skipped';

export type SlotName =
  | 'current_occupation'
  | 'previous_experience'
  | 'hidden_expertise'
  | 'preferred_audience'
  | 'future_goal'
  | 'personal_story';

export interface Slot {
  value: string;
  status: SlotStatus;
}

export type SlotMap = Record<SlotName, Slot>;

export interface SlotExtractionResult {
  reply: string;
  slot_updates: Partial<Record<SlotName, Partial<Slot>>>;
  next_focus: SlotName;
  is_complete: boolean;
  completion_reason: string | null;
}

// ============================================================
// Slot definitions with metadata
// ============================================================

export const SLOT_DEFINITIONS: Record<SlotName, {
  key: SlotName;
  label_zh: string;
  label_en: string;
  label_ms: string;
  description_zh: string;
  priority: number; // 1 = highest
}> = {
  current_occupation: {
    key: 'current_occupation',
    label_zh: '目前职业',
    label_en: 'Current Occupation',
    label_ms: 'Pekerjaan Semasa',
    description_zh: '你现在在做什么工作？',
    priority: 1,
  },
  previous_experience: {
    key: 'previous_experience',
    label_zh: '过往经历',
    label_en: 'Previous Experience',
    label_ms: 'Pengalaman Lepas',
    description_zh: '你以前做过什么？有什么特别的故事？',
    priority: 2,
  },
  preferred_audience: {
    key: 'preferred_audience',
    label_zh: '目标受众',
    label_en: 'Target Audience',
    label_ms: 'Audiens Sasaran',
    description_zh: '你最想帮到什么样的人？',
    priority: 3,
  },
  personal_story: {
    key: 'personal_story',
    label_zh: '个人故事',
    label_en: 'Personal Story',
    label_ms: 'Kisah Peribadi',
    description_zh: '你最有成就感的一件事是什么？',
    priority: 4,
  },
  hidden_expertise: {
    key: 'hidden_expertise',
    label_zh: '隐藏专长',
    label_en: 'Hidden Expertise',
    label_ms: 'Kepakaran Tersembunyi',
    description_zh: '别人最常来找你帮忙的事情是什么？',
    priority: 5,
  },
  future_goal: {
    key: 'future_goal',
    label_zh: '未来目标',
    label_en: 'Future Goal',
    label_ms: 'Matlamat Masa Depan',
    description_zh: '未来一年你最想达成什么？',
    priority: 6,
  },
};

export const SLOT_NAMES: SlotName[] = [
  'current_occupation',
  'previous_experience',
  'hidden_expertise',
  'preferred_audience',
  'future_goal',
  'personal_story',
];

export const SLOTS_BY_PRIORITY: SlotName[] = [
  'current_occupation',
  'previous_experience',
  'preferred_audience',
  'personal_story',
  'hidden_expertise',
  'future_goal',
];

// ============================================================
// Empty slots factory
// ============================================================

export function createEmptySlots(): SlotMap {
  return SLOT_NAMES.reduce((acc, name) => {
    acc[name] = { value: '', status: 'empty' };
    return acc;
  }, {} as SlotMap);
}

// ============================================================
// Slot status helpers
// ============================================================

export function getFilledSlotCount(slots: SlotMap): number {
  return SLOT_NAMES.filter((name) => slots[name].status === 'filled').length;
}

export function getPartialSlotCount(slots: SlotMap): number {
  return SLOT_NAMES.filter((name) => slots[name].status === 'partial').length;
}

export function getEmptySlotCount(slots: SlotMap): number {
  return SLOT_NAMES.filter((name) => slots[name].status === 'empty').length;
}

export function getSkippedSlotCount(slots: SlotMap): number {
  return SLOT_NAMES.filter((name) => slots[name].status === 'skipped').length;
}

/**
 * Returns the slot fill percentage (filled + partial / total).
 */
export function getSlotFillPercent(slots: SlotMap): number {
  const total = SLOT_NAMES.length;
  const filled = getFilledSlotCount(slots) + getPartialSlotCount(slots);
  return Math.round((filled / total) * 100);
}

/**
 * Returns the first missing slot by priority order.
 */
export function getNextMissingSlot(slots: SlotMap): SlotName | null {
  for (const name of SLOTS_BY_PRIORITY) {
    if (slots[name].status === 'empty' || slots[name].status === 'skipped') {
      return name;
    }
  }
  return null;
}

/**
 * Returns all slots that are not yet filled (empty or partial).
 */
export function getMissingSlots(slots: SlotMap): SlotName[] {
  return SLOTS_BY_PRIORITY.filter(
    (name) => slots[name].status !== 'filled',
  );
}

/**
 * Check if the core required slots are sufficiently filled.
 */
export function areCoreSlotsSufficient(slots: SlotMap): boolean {
  const required: SlotName[] = [
    'current_occupation',
    'hidden_expertise',
    'preferred_audience',
    'personal_story',
  ];
  const hasRequired = required.every(
    (name) => slots[name].status === 'partial' || slots[name].status === 'filled',
  );
  const hasCore =
    slots.hidden_expertise.status === 'filled' ||
    slots.personal_story.status === 'filled';
  return hasRequired && hasCore;
}

/**
 * Merge slot updates from AI response into the slot map.
 */
export function mergeSlotUpdates(
  slots: SlotMap,
  updates?: Partial<Record<SlotName, Partial<Slot>>>,
): SlotMap {
  const result = { ...slots };
  if (!updates) return result;

  for (const name of SLOT_NAMES) {
    const update = updates[name];
    if (!update) continue;

    const existing = result[name];
    const value =
      typeof update.value === 'string' && update.value.trim()
        ? update.value.trim()
        : existing.value;

    const status: SlotStatus =
      update.status === 'partial' ||
      update.status === 'filled' ||
      update.status === 'skipped'
        ? update.status
        : value
          ? existing.status === 'empty'
            ? 'partial'
            : existing.status
          : existing.status;

    result[name] = { value, status };
  }

  return result;
}

/**
 * Normalize a raw value into a Slot object.
 */
export function normalizeSlot(value: unknown): Slot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { value: '', status: 'empty' };
  }
  const raw = value as Record<string, unknown>;
  const status: SlotStatus =
    raw.status === 'partial' ||
    raw.status === 'filled' ||
    raw.status === 'skipped'
      ? raw.status
      : 'empty';
  return {
    value: typeof raw.value === 'string' ? raw.value : '',
    status,
  };
}

/**
 * Check if a user message indicates they're stuck.
 */
export function isStuckMessage(message: string): boolean {
  return /不知道|不懂|没想|沒想|想不到|不清楚|随便|隨便|没有|沒有|idk|not sure|don't know/i.test(message);
}

/**
 * Convert slots to a human-readable summary for AI prompts.
 */
export function slotsToText(slots: SlotMap): string {
  return SLOT_NAMES.map(
    (name) =>
      `${name}: ${slots[name].value || '(empty)'} [${slots[name].status}]`,
  ).join('\n');
}
