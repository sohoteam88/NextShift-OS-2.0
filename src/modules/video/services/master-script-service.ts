import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MasterScript, ScriptScene, VideoHook, VideoProductionInput, VideoStrategy } from '../types';
import { generateVideoJson } from './json';

const SCENE_COUNT_BY_DURATION: Record<VideoProductionInput['duration'], number> = {
  '15s': 3,
  '30s': 5,
  '60s': 7,
  '90s': 9,
};

const STYLE_GUIDANCE: Record<VideoProductionInput['style'], string> = {
  talking_head: '真人出镜对镜头说话。画面描述应包含表情、手势、镜头距离变化。',
  faceless: '不露脸。画面描述用文字卡片、截图、手部特写、产品特写、场景镜头。',
  broll_voiceover: 'B-roll 素材配旁白。画面应是与内容相关的真实场景或动作镜头。',
  tutorial: '步骤演示。画面应清楚展示手在做什么，每个步骤一个镜头。',
  storytelling: '叙事型。画面应配合故事时间线：过去、现在、转折、结果。',
};

const DEFAULT_HOOK: VideoHook = {
  text: '你以为问题是没时间，其实多数人是第一步走错了。',
  visual_concept: '镜头从焦虑表情切到纸上写着第一步三个字。',
  hook_type: '反直觉',
  alternates: [
    { text: '如果你一直卡住，先别急着学更多方法。', hook_type: '痛点' },
    { text: '为什么很多人第一周就放弃？答案通常不是懒。', hook_type: '好奇' },
  ],
};

function defaultScript(input: VideoProductionInput, strategy: VideoStrategy, hook: VideoHook): MasterScript {
  const sceneCount = SCENE_COUNT_BY_DURATION[input.duration] ?? 5;
  const scenes = Array.from({ length: sceneCount }, (_, index) => ({
    scene_number: index + 1,
    time_range: index === 0 ? '0-3s' : `${index * 5}-${(index + 1) * 5}s`,
    purpose: index === 0 ? '建立冲突' : index === sceneCount - 1 ? '号召行动' : '推进观点',
    visual: index === 0 ? hook.visual_concept : `围绕「${input.topic}」展示一个具体、可拍摄的画面。`,
    text_overlay: index === 0 ? hook.text : strategy.recommended_angle,
    voiceover: index === 0 ? hook.text : `把「${input.audience_pain}」拆成一个观众今天能理解的小步骤。`,
    emotion: index === 0 ? '好奇' : '清楚、有共鸣',
  }));
  return {
    title: input.topic,
    total_duration: input.duration,
    hook,
    scenes,
    cta: scenes[scenes.length - 1]!,
    pacing_notes: '前 3 秒快切制造注意力，中段放慢解释，最后明确给出下一步。',
  };
}

export const masterScriptService = {
  async generateHook(user: AuthUser, input: VideoProductionInput, strategy: VideoStrategy) {
    const firstEmotion = strategy.emotional_arc.split('→')[0]?.trim() || '好奇';

    const systemPrompt = `Generate the opening hook for a short video.

Strategy: ${strategy.recommended_angle} — ${strategy.angle_reason}
Emotional arc starts with: ${firstEmotion}
Topic: ${input.topic}
Audience pain: ${input.audience_pain}

Generate:
- ONE primary hook with text, visual_concept, hook_type
- TWO alternate hooks using different hook_types from 痛点/好奇/故事/数字/反直觉/误区/冲突

Return ONLY JSON:
{ "text": "...", "visual_concept": "...", "hook_type": "...", "alternates": [{ "text": "...", "hook_type": "..." }, { "text": "...", "hook_type": "..." }] }`;

    return generateVideoJson<VideoHook>(user, {
      systemPrompt,
      userMessage: JSON.stringify(input),
      feature: 'video_hook',
      fallback: DEFAULT_HOOK,
      platform: input.platform,
      temperature: 0.9,
      maxTokens: 500,
    });
  },

  async generateScript(
    user: AuthUser,
    input: VideoProductionInput,
    strategy: VideoStrategy,
    chosenHook: VideoHook,
  ) {
    const sceneCount = SCENE_COUNT_BY_DURATION[input.duration] ?? 5;

    const systemPrompt = `Write a complete master script for a ${input.duration} ${input.platform} video.

Strategy:
- Angle: ${strategy.recommended_angle}
- Emotional arc: ${strategy.emotional_arc}
- Funnel alignment: ${strategy.funnel_stage_alignment}

Style: ${STYLE_GUIDANCE[input.style]}
Hook: ${JSON.stringify(chosenHook)}

Requirements:
- Total ${sceneCount} scenes including hook and CTA
- Each scene has scene_number, time_range, purpose, visual, text_overlay, voiceover, emotion
- Scenes must follow emotional arc: ${strategy.emotional_arc}
- Last scene is CTA specific to funnel_stage "${input.funnel_stage}"
- pacing_notes explains rhythm
- Write in Chinese Malaysian style
- No income claims or exaggerated health promises

Return ONLY JSON matching MasterScript:
{ "title": "...", "total_duration": "...", "hook": {...}, "scenes": [...], "cta": {...}, "pacing_notes": "..." }`;

    return generateVideoJson<MasterScript>(user, {
      systemPrompt,
      userMessage: JSON.stringify({
          topic: input.topic,
          content_pillar: input.content_pillar,
          audience_pain: input.audience_pain,
          funnel_stage: input.funnel_stage,
          personal_story_excerpt: input.personal_story_excerpt,
      }),
      feature: 'master_script',
      fallback: defaultScript(input, strategy, chosenHook),
      platform: input.platform,
      temperature: 0.7,
      maxTokens: 2200,
    });
  },

  async regenerateScene(user: AuthUser, fullScript: MasterScript, sceneNumber: number, instruction: string) {
    const targetScene = fullScript.scenes.find((scene) => scene.scene_number === sceneNumber) ?? fullScript.cta;

    const systemPrompt = `Rewrite ONE scene of this video script based on user instruction.
Keep the same scene_number, time_range, and purpose unless instructed otherwise.
Maintain consistency with surrounding scenes and overall pacing.

Full script context: ${JSON.stringify(fullScript)}
Target scene: ${JSON.stringify(targetScene)}
User instruction: ${instruction}

Return ONLY JSON for one ScriptScene: { "scene_number": 1, "time_range": "...", "purpose": "...", "visual": "...", "text_overlay": "...", "voiceover": "...", "emotion": "..." }`;

    return generateVideoJson<ScriptScene>(user, {
      systemPrompt,
      userMessage: instruction,
      feature: 'video_scene_edit',
      fallback: targetScene,
      platform: 'tiktok',
      temperature: 0.7,
      maxTokens: 500,
    });
  },
};
