// ============================================================
// Dynamic Coach Brain
// Determines the next question based on missing slots.
// Modularized from brand-interview-service.ts dialogue logic.
// ============================================================

import {
  type SlotMap,
  type SlotName,
  SLOT_DEFINITIONS,
  SLOTS_BY_PRIORITY,
  getNextMissingSlot,
  areCoreSlotsSufficient,
} from './slotExtractionService';

// ============================================================
// Types
// ============================================================

export interface CoachQuestion {
  /** The question text the AI coach should ask */
  question: string;
  /** Which slot this question targets */
  targetSlot: SlotName;
  /** Why this question was chosen */
  rationale: string;
}

export interface CoachState {
  turnCount: number;
  stuckCounts: Partial<Record<SlotName, number>>;
  currentFocus: SlotName;
  previousFocuses: SlotName[];
}

// ============================================================
// Question bank — warm, conversational, Malaysian Chinese
// ============================================================

const QUESTION_BANK: Record<SlotName, string[]> = {
  current_occupation: [
    '你现在在做什么工作呀？',
    '平时是靠什么在赚钱的？',
    '你目前的主要职业是什么？',
    '你现在每天都在忙什么？',
  ],
  previous_experience: [
    '以前做过什么工作吗？',
    '过去有什么经历让你学到很多东西？',
    '进入这个行业之前你是做什么的？',
    '你之前的经验是什么？',
  ],
  preferred_audience: [
    '你最想帮到什么样的人？',
    '你希望自己的内容被谁看到？',
    '如果只能服务一种客户，你会选谁？',
    '你觉得谁最需要你的帮助？',
  ],
  personal_story: [
    '可以跟我分享一个你最有成就感的故事吗？',
    '有没有哪件事让你觉得"这就是我该做的事"？',
    '什么时候你觉得自己帮助到了别人？',
    '你做过最让自己骄傲的事是什么？',
  ],
  hidden_expertise: [
    '你身边的人最常来找你帮什么忙？',
    '朋友遇到什么问题第一个想到你？',
    '你帮别人解决过什么问题，让你觉得"我其实蛮会这个的"？',
    '有没有什么事情别人觉得很难，你做起来却很轻松？',
  ],
  future_goal: [
    '未来一年你最想达成什么目标？',
    '如果一年后回头看，你希望自己变成什么样？',
    '你心里最想改变的是什么？',
    '你想要的未来是什么样的？',
  ],
};

// Follow-up prompts for when a slot is partially filled
const FOLLOW_UP_BANK: Record<SlotName, string[]> = {
  current_occupation: [
    '可以多讲一点你的工作内容吗？',
  ],
  previous_experience: [
    '那段经历里最深刻的是什么？',
  ],
  preferred_audience: [
    '为什么特别想帮这群人？',
  ],
  personal_story: [
    '那时候你心里是什么感觉？可以讲得更具体一点吗？',
  ],
  hidden_expertise: [
    '可以举个例子吗？最近一次是什么时候？',
  ],
  future_goal: [
    '是什么让你想达到这个目标？',
  ],
};

// Alternative questions for when user is stuck on a slot
const UNSTUCK_BANK: Record<SlotName, string[]> = {
  current_occupation: [
    '没关系，不用太正式。你就随便讲讲你每天大概在做什么就好。',
  ],
  previous_experience: [
    '不用想太远，就说你上一份工是什么就好。',
  ],
  preferred_audience: [
    '换个方式问：你发朋友圈最希望谁点赞？',
  ],
  personal_story: [
    '不需要很大件事。一个小小但让你开心的moment就可以了。',
  ],
  hidden_expertise: [
    '不用想太深。你朋友最近一次 WhatsApp 问你什么？',
  ],
  future_goal: [
    '不用很具体，大概方向就好。你希望生活往哪个方向走？',
  ],
};

// ============================================================
// Coach Brain
// ============================================================

/**
 * Initialize coach state for a new session.
 */
export function createCoachState(): CoachState {
  return {
    turnCount: 0,
    stuckCounts: {},
    currentFocus: 'current_occupation',
    previousFocuses: [],
  };
}

/**
 * Pick a random question from an array.
 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Choose the next question the coach should ask.
 *
 * Priority:
 * 1. If current slot is partial, ask a follow-up
 * 2. If user is stuck, switch to an unstuck question or change slot
 * 3. Pick the next missing slot by priority
 * 4. If core slots are sufficient, signal completion
 */
export function chooseNextQuestion(
  slots: SlotMap,
  coach: CoachState,
  lastUserMessage?: string,
): CoachQuestion | null {
  const currentSlot = coach.currentFocus;
  const slotDef = SLOT_DEFINITIONS[currentSlot];
  const currentSlotState = slots[currentSlot];

  // If user was stuck on current slot, try an unstuck question or switch
  const stuckCount = coach.stuckCounts[currentSlot] ?? 0;
  if (stuckCount >= 2) {
    // Switch to next missing slot
    const next = getNextMissingSlot(slots);
    if (next) {
      return {
        question: pick(QUESTION_BANK[next]),
        targetSlot: next,
        rationale: `User stuck on ${currentSlot}, switching to ${next}`,
      };
    }
  }

  // If current slot is stuck once, give an easier version
  if (stuckCount === 1) {
    return {
      question: pick(UNSTUCK_BANK[currentSlot]),
      targetSlot: currentSlot,
      rationale: `Unstucking ${currentSlot} with simpler prompt`,
    };
  }

  // If current slot is partial, ask a follow-up to deepen
  if (currentSlotState.status === 'partial') {
    return {
      question: pick(FOLLOW_UP_BANK[currentSlot]),
      targetSlot: currentSlot,
      rationale: `Deepening partial slot: ${currentSlot}`,
    };
  }

  // If current slot is filled, move to next missing slot
  if (currentSlotState.status === 'filled' || currentSlotState.status === 'skipped') {
    const next = getNextMissingSlot(slots);
    if (next) {
      return {
        question: pick(QUESTION_BANK[next]),
        targetSlot: next,
        rationale: `${currentSlot} is ${currentSlotState.status}, advancing to ${next}`,
      };
    }
  }

  // If current slot is empty, ask the standard opening question
  if (currentSlotState.status === 'empty') {
    return {
      question: pick(QUESTION_BANK[currentSlot]),
      targetSlot: currentSlot,
      rationale: `Opening question for ${currentSlot}`,
    };
  }

  return null;
}

/**
 * Check if the coach should signal completion.
 * Returns true when core slots are sufficient and turn count is reasonable.
 */
export function shouldComplete(slots: SlotMap, turnCount: number): boolean {
  return turnCount >= 6 && areCoreSlotsSufficient(slots);
}

/**
 * Get a closing message from the coach.
 */
export function getClosingMessage(): string {
  const closings = [
    '聊得差不多啦，我已经抓到你的重点了。接下来我帮你整理成清楚的品牌方向。',
    '很棒！我已经收集到足够的信息了。让我帮你整理一下你的品牌定位。',
    '谢谢你跟我聊这么多，现在让我帮你把故事变成品牌。',
  ];
  return pick(closings);
}

/**
 * Get a hard-cap message when turn limit is reached.
 */
export function getHardCapMessage(): string {
  return '我们先到这里就可以了，我已经有足够资料帮你整理方向。';
}

/**
 * Update coach state after a user turn.
 */
export function advanceCoachState(
  coach: CoachState,
  slots: SlotMap,
  newFocus?: SlotName,
): CoachState {
  const next: CoachState = {
    turnCount: coach.turnCount + 1,
    stuckCounts: { ...coach.stuckCounts },
    currentFocus: newFocus ?? coach.currentFocus,
    previousFocuses: [...coach.previousFocuses],
  };

  if (newFocus && newFocus !== coach.currentFocus) {
    next.previousFocuses.push(coach.currentFocus);
  }

  return next;
}

/**
 * Record that the user appeared stuck on the current slot.
 */
export function recordStuck(
  coach: CoachState,
  slot: SlotName,
): CoachState {
  return {
    ...coach,
    stuckCounts: {
      ...coach.stuckCounts,
      [slot]: (coach.stuckCounts[slot] ?? 0) + 1,
    },
  };
}

/**
 * Get a warm opening message for the coach.
 */
export function getOpeningMessage(): string {
  const openings = [
    '你好，我是你的品牌教练 👋 先随便聊聊——你现在在做什么呀？',
    '嗨！我是你的AI品牌教练。我们先轻松聊一下，你现在从事什么行业？',
    '哈咯！我是你的品牌教练。不用紧张，告诉我你目前的工作是什么就好。',
  ];
  return pick(openings);
}
