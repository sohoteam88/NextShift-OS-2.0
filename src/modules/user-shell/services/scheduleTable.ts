export interface ScheduleEntry {
  content: string;
}

export const EXPERIENCE_LAST_DAY = 4;

export const EXPERIENCE_SCHEDULE: Readonly<Partial<Record<number, ScheduleEntry>>> = {
  1: { content: '逐个介绍拿到的每一个产品；教冲泡方法；拍 before 照' },
  2: { content: '开始喝了没有？味道如何？' },
  // TODO: Day 3 待 Steven 口述后再补；缺内容时由 resolver 明示 content_pending。
  4: { content: '喝到有感觉了才会开始跟他规划下一步' },
};

export const BUSINESS_SCHEDULE: Readonly<Partial<Record<number, ScheduleEntry>>> = {
  // TODO: 事业包待补，Steven 口述后再补
};
