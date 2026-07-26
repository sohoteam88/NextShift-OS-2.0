import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { AIVideoPrompt, AIVideoPromptResult, MasterScript } from '../types';
import { generateVideoJson, parseJsonFromAI } from './json';

const PLATFORM_ASPECT: Record<string, '9:16' | '1:1' | '16:9'> = {
  facebook_reel: '9:16',
  instagram_reel: '9:16',
  tiktok: '9:16',
  instagram_story: '9:16',
  xiaohongshu: '9:16',
  youtube_shorts: '9:16',
};

function fallbackPrompts(script: MasterScript, platform: string, scenes: number[], language: 'en' | 'zh'): AIVideoPromptResult {
  const aspect = PLATFORM_ASPECT[platform] ?? '9:16';
  const prompts = script.scenes
    .filter((scene) => scenes.includes(scene.scene_number))
    .map((scene) => ({
      scene_number: scene.scene_number,
      prompt: language === 'en'
        ? `${scene.visual}, cinematic vertical video, soft natural light, shallow depth of field`
        : `${scene.visual}，竖屏短视频，自然光，电影感，画面干净`,
      aspect_ratio: aspect,
      duration_hint: '5s',
      style_modifiers: language === 'en' ? ['cinematic', 'soft natural light', 'vertical video'] : ['电影感', '自然光', '竖屏'],
      negative_prompt: language === 'en' ? 'no text, no logos, no blurry motion' : '不要文字，不要Logo，不要模糊',
    }));
  return {
    scenes: prompts,
    combined: prompts.map((prompt) => `[Scene ${prompt.scene_number}] ${prompt.prompt}`).join('\n\n'),
  };
}

function parsePromptResult(text: string, label: string): AIVideoPromptResult {
  const parsed = parseJsonFromAI<{ scenes: AIVideoPrompt[] }>(text);
  if (!Array.isArray(parsed.scenes)) throw new Error('AI returned malformed JSON');
  return {
    scenes: parsed.scenes,
    combined: parsed.scenes.map((scene) => `[${label} ${scene.scene_number}] ${scene.prompt}`).join('\n\n'),
  };
}

export const aiVideoPromptService = {
  async generateVeoPrompt(user: AuthUser, script: MasterScript, platform: string, brollScenes: number[]) {
    const aspect = PLATFORM_ASPECT[platform] ?? '9:16';

    const systemPrompt = `Convert these video scenes into Google Veo prompts.
- Describe cinematically: subject, action, setting, camera angle, lighting, mood
- Present tense, one clear action per prompt
- Aspect ratio: ${aspect}
- Avoid text overlays, logos, specific brand names, privacy-sensitive real faces
- style_modifiers as a short English array
- negative_prompt with what to avoid

Only generate prompts for scene numbers: ${brollScenes.join(', ')}
Return ONLY JSON: { "scenes": [{ scene_number, prompt, aspect_ratio, duration_hint, style_modifiers, negative_prompt }] }`;

    const fallback = fallbackPrompts(script, platform, brollScenes, 'en');
    return generateVideoJson<AIVideoPromptResult>(user, {
      systemPrompt,
      userMessage: JSON.stringify(script.scenes.filter((scene) => brollScenes.includes(scene.scene_number))),
      feature: 'veo_prompt',
      fallback,
      platform,
      temperature: 0.7,
      maxTokens: 1200,
      parse: (text) => parsePromptResult(text, 'Scene'),
    });
  },

  async generateMiniMaxPrompt(user: AuthUser, script: MasterScript, platform: string, brollScenes: number[]) {
    const aspect = PLATFORM_ASPECT[platform] ?? '9:16';

    const systemPrompt = `将这些视频场景转换为 MiniMax 视频生成提示词。
- 用简洁中文描述：主体、动作、场景、镜头运动、氛围
- 每个片段约 5 秒，聚焦一个清晰动作
- 宽高比: ${aspect}
- 避免文字、Logo、品牌名称
- style_modifiers 用简短中文数组
- negative_prompt 说明要避免的内容

只为以下场景编号生成提示词: ${brollScenes.join(', ')}
Return ONLY JSON: { "scenes": [{ scene_number, prompt, aspect_ratio, duration_hint, style_modifiers, negative_prompt }] }`;

    const fallback = fallbackPrompts(script, platform, brollScenes, 'zh');
    return generateVideoJson<AIVideoPromptResult>(user, {
      systemPrompt,
      userMessage: JSON.stringify(script.scenes.filter((scene) => brollScenes.includes(scene.scene_number))),
      feature: 'minimax_prompt',
      fallback,
      platform,
      temperature: 0.7,
      maxTokens: 1200,
      parse: (text) => parsePromptResult(text, '场景'),
    });
  },
};
