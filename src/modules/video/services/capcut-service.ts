import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { CapCutScript, MasterScript } from '../types';
import { generateVideoJson } from './json';

function fallbackCapCut(script: MasterScript): CapCutScript {
  return {
    edit_instructions: script.scenes.map((scene) => ({
      scene_number: scene.scene_number,
      clip_duration: scene.time_range,
      text_overlay: { content: scene.text_overlay, style_name: scene.scene_number === 1 ? 'Hook文字' : '正文字幕', position: 'center', animation: scene.scene_number === 1 ? '弹入' : '淡入' },
      effects: scene.scene_number === 1 ? ['放大 110%'] : ['轻微推近'],
      sound_effect: scene.scene_number === 1 ? '文字出现时叮声' : undefined,
    })),
    text_styles: [
      { name: 'Hook文字', usage: '开头冲突和重点句', font_suggestion: '粗体黑体', color: '黄色 #FACC15' },
      { name: '正文字幕', usage: '旁白字幕', font_suggestion: '清晰无衬线', color: '白色描边' },
    ],
    transitions: script.scenes.slice(0, -1).map((scene, index) => ({ between_scenes: `Scene ${scene.scene_number}→${script.scenes[index + 1]?.scene_number}`, suggested_transition: '直接切' })),
    music_suggestion: { mood: '轻快好奇', capcut_category: 'Upbeat', bpm_range: '100-120' },
    overall_pacing: '前 3 秒快切建立悬念，中段稳定解释，最后放慢强调 CTA。',
  };
}

export const capcutService = {
  async generate(user: AuthUser, script: MasterScript, brandPersonality: string, platform: string) {
    const systemPrompt = `Generate a CapCut editing guide for this video script, written so a beginner can follow it step-by-step.

For each scene specify clip_duration, text_overlay, effects, optional sound_effect.
Also define text_styles, transitions, music_suggestion, overall_pacing.
Text styles should match brand personality "${brandPersonality}".
Return ONLY JSON matching CapCutScript.`;

    return generateVideoJson<CapCutScript>(user, {
      systemPrompt,
      userMessage: JSON.stringify(script),
      feature: 'capcut_script',
      fallback: fallbackCapCut(script),
      platform,
      temperature: 0.5,
      maxTokens: 1500,
    });
  },
};
