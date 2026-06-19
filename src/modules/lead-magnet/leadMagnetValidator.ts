import type { LeadMagnetConfig, LeadMagnetQuality } from './types';

export function validateLeadMagnet(lm: LeadMagnetConfig): LeadMagnetQuality {
  const missing: string[] = []; const recs: string[] = [];
  let audienceRelevance = lm.audiencePain ? 80 : 20;
  let painClarity = lm.audiencePain.length > 10 ? 75 : 30;
  let promiseClarity = lm.promise.length > 10 ? 70 : 20;
  let ctaStrength = lm.cta.buttonText ? 75 : 0;
  let conversionReadiness = lm.resultPage.cta.buttonText ? 70 : 20;
  let brandAlignment = lm.title ? 80 : 10;
  if (!lm.cta.buttonText) { missing.push('cta'); recs.push('结果承诺不够明确，需要具体的CTA。'); }
  if (!lm.resultPage.cta.buttonText) { missing.push('resultPage.cta'); recs.push('结果页必须有下一步行动。'); }
  if ((lm.sections?.length ?? 0) < 2 && !lm.checklistItems?.length && lm.type !== 'assessment' && lm.type !== 'quiz') {
    recs.push('资源内容需要更完整，至少包含两个核心段落或清单。');
  }
  if ((lm.questions?.length ?? 0) < 3 && (lm.type === 'assessment' || lm.type === 'quiz')) {
    recs.push('问题需要更贴近目标受众，至少3个问题。');
  }
  const score = Math.round(audienceRelevance*0.2+painClarity*0.15+promiseClarity*0.15+ctaStrength*0.2+conversionReadiness*0.15+brandAlignment*0.15);
  return { score, audienceRelevance, painClarity, promiseClarity, ctaStrength, conversionReadiness, brandAlignment, missingItems: missing, recommendations: recs.slice(0, 3) };
}
