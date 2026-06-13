import type { ContentPillar } from '@/modules/brand-dna/types';

export interface ContentAdvisorTip {
  id: string;
  priority: number;
  title: string;
  body: string;
  action: string;
}

export function getContentAdvisorTips(
  pillars: ContentPillar[],
  publishedCount: number,
  hasCalendar: boolean,
): ContentAdvisorTip[] {
  const tips: ContentAdvisorTip[] = [];

  if (pillars.length === 0) {
    tips.push({
      id: 'no_pillars',
      priority: 1,
      title: '先建立内容支柱',
      body: '内容支柱是持续创作的骨架。先确定 3-5 个你会持续写的话题方向。',
      action: '点击"生成内容支柱"',
    });
  }

  if (publishedCount === 0) {
    tips.push({
      id: 'first_post',
      priority: 2,
      title: '发布第一篇内容',
      body: '先发布一篇简单故事贴，不要等完美。告诉别人你是谁、为什么做这件事。',
      action: '选择平台 → 生成第一篇文章',
    });
  }

  if (!hasCalendar) {
    tips.push({
      id: 'no_calendar',
      priority: 3,
      title: '生成内容日历',
      body: '有了日历，你就永远不会不知道今天该发什么。先生成 30 天试试。',
      action: '生成 30 天内容日历',
    });
  }

  if (publishedCount > 0 && publishedCount < 5) {
    tips.push({
      id: 'keep_going',
      priority: 4,
      title: '继续保持节奏',
      body: '你已经发了第一篇文章了！保持每周至少 3 篇的节奏，内容是积累的游戏。',
      action: '继续生成和发布内容',
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: 'all_good',
      priority: 99,
      title: '内容引擎运转中',
      body: '你已经有内容支柱和日历了，继续保持发布节奏。下一步可以尝试视频内容。',
      action: '去视频引擎',
    });
  }

  return tips.sort((a, b) => a.priority - b.priority);
}
