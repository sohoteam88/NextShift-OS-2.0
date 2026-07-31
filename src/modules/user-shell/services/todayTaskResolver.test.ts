import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTodayTask } from './todayTaskResolver';

const NOW = new Date('2026-07-31T12:00:00.000Z');

describe('getTodayTask', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prioritizes a follow-up that has waited more than 24 hours', () => {
    const result = getTodayTask(
      { businessStartAt: null, createdAt: new Date('2026-07-31T08:00:00.000Z') },
      [
        { id: 'recent', waitingSince: new Date('2026-07-30T13:00:00.000Z') },
        { id: 'overdue', waitingSince: new Date('2026-07-30T10:59:59.000Z') },
      ],
    );

    expect(result).toEqual({
      type: 'followup',
      followup: { id: 'overdue', waitingSince: new Date('2026-07-30T10:59:59.000Z') },
    });
  });

  it('uses the experience schedule when businessStartAt is null', () => {
    const result = getTodayTask(
      { businessStartAt: null, createdAt: new Date('2026-07-30T12:00:00.000Z') },
      [],
    );

    expect(result).toEqual({
      type: 'schedule',
      phase: 'experience',
      day: 2,
      status: 'ready',
      content: '开始喝了没有？味道如何？',
    });
  });

  it('returns an honest pending result for experience Day 3', () => {
    const result = getTodayTask(
      { businessStartAt: null, createdAt: new Date('2026-07-29T12:00:00.000Z') },
      [],
    );

    expect(result).toEqual({
      type: 'schedule',
      phase: 'experience',
      day: 3,
      status: 'content_pending',
    });
  });

  it('caps an unfinished experience phase at Day 4', () => {
    const result = getTodayTask(
      { businessStartAt: null, createdAt: new Date('2026-07-20T12:00:00.000Z') },
      [],
    );

    expect(result).toEqual({
      type: 'schedule',
      phase: 'experience',
      day: 4,
      status: 'ready',
      content: '喝到有感觉了才会开始跟他规划下一步',
    });
  });

  it('indexes the business schedule from businessStartAt without inventing content', () => {
    const result = getTodayTask(
      {
        businessStartAt: new Date('2026-07-28T12:00:00.000Z'),
        createdAt: new Date('2026-07-01T12:00:00.000Z'),
      },
      [],
    );

    expect(result).toEqual({
      type: 'schedule',
      phase: 'business',
      day: 4,
      status: 'content_pending',
    });
  });
});
