// ============================================================
// Video Generators — All deterministic, powered by BrandContext
// ============================================================

import type { BrandContext } from '@/modules/brand-dna/types';
import type {
  VideoBrief, VideoStrategy, HookOption, ScriptScene,
  BrollItem, PlatformAdaptation, VideoPlatform, VideoType,
  VideoFunnelStage, VideoDuration,
} from './types';

// ---- Helpers ----
const VIDEO_TYPES: Record<VideoType, string> = {
  personal_story: '个人故事', education: '教育内容', objection_handling: '解决顾虑',
  transformation: '转变见证', lifestyle: '日常分享', invitation: '活动邀约',
  testimonial: '客户见证', comparison: '对比分析', myth_busting: '打破迷思',
};

// ---- Video Strategy ----
export function generateVideoStrategy(
  ctx: BrandContext, brief: VideoBrief,
): VideoStrategy {
  return {
    goal: `帮助${ctx.audience || '目标受众'}理解${brief.contentPillar}，建立${ctx.brandName || '品牌'}信任`,
    targetViewer: ctx.audience || '对个人品牌感兴趣的人',
    coreMessage: ctx.messaging.coreMessage || ctx.positioning || '',
    emotionalAngle: brief.videoType === 'personal_story' ? '真实、有温度的个人经历' :
      brief.videoType === 'transformation' ? '从困境到突破的转变过程' : '用专业帮助受众解决问题',
    contentAngle: `${VIDEO_TYPES[brief.videoType] || brief.videoType} | ${ctx.tone || '温暖亲切'}`,
    retentionStrategy: `开头用痛点抓住注意力（0-3秒）→ 中间用故事或方法留住（3-${brief.videoLength - 5}秒）→ 结尾轻CTA（最后5秒）`,
    ctaStrategy: brief.ctaGoal || '引导评论互动 / 私信咨询',
  };
}

// ---- Hook Generator ----
export function generateHooks(ctx: BrandContext, brief: VideoBrief): HookOption[] {
  const audience = ctx.audience || '很多人';
  return [
    { type: 'pain', text: `${audience}最大的困扰就是${brief.audiencePain}。` },
    { type: 'curiosity', text: `${ctx.personalName || '我'}花了一年才明白这个道理...` },
    { type: 'story', text: `从一个${brief.audiencePain}的故事开始讲起。` },
    { type: 'contradiction', text: `你以为${brief.contentPillar}很难？其实你做反了。` },
    { type: 'benefit', text: `想解决${brief.audiencePain}？看这一个视频就够了。` },
  ];
}

// ---- Master Script ----
export function scriptForDuration(
  ctx: BrandContext, hook: string, brief: VideoBrief,
): string {
  const name = ctx.personalName || '我';
  const dur = brief.videoLength;

  if (dur <= 15) {
    return [
      `【Hook 0-3秒】${hook}`,
      `【核心信息 3-10秒】${ctx.messaging.coreMessage || '一个简单方法改变你的想法'}`,
      `【CTA 10-15秒】关注${name}，每天一个品牌技巧 💪`,
    ].join('\n\n');
  }

  if (dur <= 30) {
    return [
      `【Hook 0-3秒】${hook}`,
      `【背景 3-8秒】大家好，我是${name}。我做${ctx.positioning || '这件事'}的原因是...`,
      `【核心信息 8-20秒】${brief.audiencePain}的关键在于...（展开观点）`,
      `【证明/故事 20-25秒】举个例子...`,
      `【CTA 25-30秒】如果你也在面对${brief.audiencePain}，评论区告诉我 👇`,
    ].join('\n\n');
  }

  // 45-60 sec
  return [
    `【Hook 0-3秒】${hook}`,
    `【背景 3-10秒】大家好，我是${name}。${ctx.positioning || ''}`,
    `【痛点展开 10-20秒】${brief.audiencePain}这个问题其实比想象的普遍...`,
    `【核心观点 20-35秒】为什么大多数人都做错了？因为...（展开2-3个要点）`,
    `【故事/证明 35-45秒】以我自己为例...${dur >= 60 ? '（详细讲述过程和结果）' : ''}`,
    `【转折/总结 45-${dur - 5}秒】所以记住：...`,
    `【CTA 最后5秒】想要${brief.contentPillar}模板？私信我 👇`,
  ].join('\n\n');
}

// ---- Shot List ----
export function generateShotList(brief: VideoBrief): ScriptScene[] {
  const base: ScriptScene[] = [
    { sceneNumber: 1, duration: 3, visualDirection: '中景，直接看向镜头', cameraAngle: '正面', action: '自信地说出Hook', spokenLine: '[Hook]', onScreenText: '大标题：痛点关键词' },
    { sceneNumber: 2, duration: 4, visualDirection: '近景，自然光线', cameraAngle: '正面微侧', action: '边走边说/坐在桌前', spokenLine: '[自我介绍 + 背景]', onScreenText: '姓名 + 身份' },
    { sceneNumber: 3, duration: brief.videoLength - 15, visualDirection: '切换多个场景', cameraAngle: '混合', action: '展示过程/方法/对比', spokenLine: '[核心内容]', onScreenText: '要点1 / 要点2 / 要点3' },
    { sceneNumber: 4, duration: 5, visualDirection: '中景', cameraAngle: '正面', action: '友善微笑', spokenLine: '[故事/证明]', onScreenText: '客户案例 / 个人经历' },
    { sceneNumber: 5, duration: 5, visualDirection: '近景，直接看向镜头', cameraAngle: '正面', action: '给出明确指令', spokenLine: '[CTA]', onScreenText: 'CTA + 箭头指向按钮' },
  ];
  return base;
}

// ---- B-Roll ----
export function generateBrollList(): BrollItem[] {
  return [
    { type: 'required', description: '手机屏幕操作（发消息/看资料）', keywords: 'phone screen, messaging' },
    { type: 'required', description: '走路/移动镜头（城市/室内走廊）', keywords: 'walking, urban, hallway' },
    { type: 'optional', description: '咖啡店/工作室环境', keywords: 'cafe, workspace, cozy' },
    { type: 'optional', description: '打字/写字特写', keywords: 'typing, writing, close-up' },
    { type: 'optional', description: '与客户互动的场景', keywords: 'meeting, conversation, smiling' },
    { type: 'optional', description: '产品/服务展示', keywords: 'product showcase, hands' },
    { type: 'optional', description: '室外自然光镜头', keywords: 'outdoor, natural light, lifestyle' },
  ];
}

// ---- AI Video Prompts ----
export function generateVeoPrompt(brief: VideoBrief, shotList: ScriptScene[], ctx: BrandContext): string {
  const scenes = shotList.map((s) => `场景${s.sceneNumber}: ${s.visualDirection}, ${s.action}, ${s.onScreenText}`).join(' | ');
  return [
    '短视频场景序列，9:16竖屏',
    `风格：${ctx.tone || '温暖真实'}，${ctx.visualIdentity.colors?.join('、') || '蓝白调'}`,
    `人物：${ctx.personalName || '主角'}，自信、友善`,
    `镜头：${scenes}`,
    '光线：自然光为主，柔和',
    '氛围：真实、不做作、有温度',
  ].join('\n');
}

export function generateMiniMaxPrompt(brief: VideoBrief, shotList: ScriptScene[]): string {
  return shotList.map((s) => `${s.visualDirection}。${s.action}。`).join(' ');
}

// ---- CapCut Script ----
export function generateCapCutScript(duration: VideoDuration): string {
  const scenes = duration <= 15 ? 3 : duration <= 30 ? 5 : 7;
  const totalFrames = duration * 30;
  const perScene = Math.floor(totalFrames / scenes);

  return [
    `项目设置: 9:16, ${duration}秒`,
    `时间线:`,
    ...Array.from({ length: scenes }, (_, i) =>
      `  ${i * perScene}-${(i + 1) * perScene}: 场景${i + 1} — 语音 + 字幕叠层 + 淡入淡出过渡`),
    `音乐: 轻快背景音乐，音量30%`,
    `字幕: 白色粗体 + 黑色描边，居中偏下`,
    `导出: 1080x1920, 30fps, H.264`,
  ].join('\n');
}

// ---- Subtitles ----
export function generateSubtitles(script: string): string {
  return script
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('【'))
    .map((line, i) => `${i + 1}\n00:00:${String(i * 5).padStart(2, '0')},000 --> 00:00:${String((i + 1) * 5).padStart(2, '0')},000\n${line.trim()}`)
    .join('\n\n');
}

// ---- Platform Adaptation ----
export function generatePlatformAdaptations(ctx: BrandContext, brief: VideoBrief): PlatformAdaptation[] {
  return [
    {
      platform: 'instagram_reels',
      hook: `${ctx.personalName || ''}: ${brief.audiencePain}？一个方法搞定`,
      caption: `${ctx.positioning || ''}\n.\n.\n#个人品牌 #成长`,
      hashtags: ['#个人品牌', '#成长', '#社交媒体技巧'],
      cta: '💾 收藏以后看',
      postingNote: 'IG Reels 用干净背景 + 文字叠层效果好',
    },
    {
      platform: 'tiktok',
      hook: `还有人不知道${brief.audiencePain}可以这样解决？`,
      caption: `${ctx.personalName || ''}教你一招 🔥 #个人品牌 #教程`,
      hashtags: ['#个人品牌', '#教程', '#fyp', '#成长'],
      cta: '关注我每天一个技巧 👆',
      postingNote: 'TikTok 前3秒必须抓眼球，Hook要够强',
    },
    {
      platform: 'facebook_reels',
      hook: `${ctx.personalName || ''}: ${brief.contentPillar}的重要性`,
      caption: `大家好，我是${ctx.personalName || '我'}。今天聊${brief.contentPillar}。\n\n${ctx.messaging.coreMessage || ''}`,
      hashtags: ['#个人品牌', '#成长'],
      cta: '觉得有用？分享给需要的人 📤',
      postingNote: 'FB Reels 适合故事+教育类内容，标题可以更长',
    },
    {
      platform: 'youtube_shorts',
      hook: `${brief.contentPillar}完全指南 | ${ctx.personalName || ''}`,
      caption: `${brief.contentPillar}的${brief.videoLength}秒指南。\n\n#Shorts #个人品牌`,
      hashtags: ['#Shorts', '#个人品牌', '#教程'],
      cta: '订阅获取更多内容 🔔',
      postingNote: 'YT Shorts 标题要像搜索关键词',
    },
    {
      platform: 'xhs_video',
      hook: `📌 ${brief.contentPillar}干货 | 新人必看`,
      caption: `${ctx.positioning || ''}\n\n${brief.videoLength}秒讲清楚${brief.contentPillar}。\n\n觉得有用记得 ❤️ + 收藏 ⭐`,
      hashtags: ['#个人品牌', '#干货分享', '#成长', '#新人必看'],
      cta: '收藏起来慢慢看 ⭐',
      postingNote: 'XHS 封面要加文字标题，标题就是搜索关键词',
    },
  ];
}
