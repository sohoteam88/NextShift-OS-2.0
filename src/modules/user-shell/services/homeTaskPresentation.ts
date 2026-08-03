import type { TodayTask } from './todayTaskResolver';

export interface HomeTaskPresentation {
  title: string;
  reason: string;
  primaryAction: string;
  estimatedMinutes: number;
}

export function getHomeTaskPresentation(todayTask: TodayTask): HomeTaskPresentation {
  if (todayTask.type === 'followup') {
    return {
      title: '有一位正在等待你的回复',
      reason: '对方已经等了一段时间，先回应她，关系就不会断掉。',
      primaryAction: '现在去回复',
      estimatedMinutes: 3,
    };
  }

  if (todayTask.status === 'content_pending') {
    return {
      title: '今天的安排正在准备中',
      reason: '内容准备好后，这里会告诉你下一步该做什么。',
      primaryAction: '我知道了',
      estimatedMinutes: 1,
    };
  }

  return {
    title: todayTask.content,
    reason: '今天先专心完成这一件事，按自己的节奏来就好。',
    primaryAction: '完成这件事',
    estimatedMinutes: 5,
  };
}
