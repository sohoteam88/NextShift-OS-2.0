import type { VideoPackage, VideoQualityResult } from './types';

export function validateVideoPackage(pkg: VideoPackage): VideoQualityResult {
  const missing: string[] = [];
  const recs: string[] = [];

  let hookStrength = pkg.hooks.length > 0 ? 70 : 0;
  if (pkg.selectedHook.length < 10) { hookStrength -= 20; recs.push('开头还不够抓人，建议直接讲痛点。'); }

  let brandAlignment = pkg.strategy.coreMessage ? 80 : 30;
  if (!pkg.strategy.coreMessage) { missing.push('coreMessage'); recs.push('核心信息缺失，从 Brand DNA 补充。'); }

  let audienceRelevance = pkg.brief.audiencePain ? 75 : 20;

  let scriptClarity = pkg.masterScript.length > 100 ? 75 : 30;
  if (pkg.masterScript.length < 100) { recs.push('脚本太短，加入更多具体内容。'); }

  let visualFeasibility = pkg.shotList.length >= 3 ? 80 : 30;
  if (pkg.shotList.length > 7) { visualFeasibility -= 20; recs.push('这支视频对新人太难拍，建议减少场景数。'); }

  let ctaClarity = pkg.strategy.ctaStrategy ? 75 : 0;
  if (!pkg.strategy.ctaStrategy) { missing.push('ctaStrategy'); recs.push('结尾需要一个轻行动，例如：想要模板可以私信我。'); }

  let platformFit = pkg.platformAdaptations.length > 0 ? 80 : 20;

  const score = Math.round(
    hookStrength * 0.2 + brandAlignment * 0.15 + audienceRelevance * 0.15 +
    scriptClarity * 0.2 + visualFeasibility * 0.1 + ctaClarity * 0.1 + platformFit * 0.1,
  );

  return { score, hookStrength, brandAlignment, audiencePainRelevance: audienceRelevance, scriptClarity, visualFeasibility, ctaClarity, platformFit, missingItems: missing, recommendations: recs.slice(0, 4) };
}
