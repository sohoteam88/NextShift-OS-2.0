import type { WebinarPackage, WebinarQuality } from './types';

export function validateWebinar(pkg: WebinarPackage): WebinarQuality {
  const m: string[] = []; const r: string[] = [];
  let audienceRelevance = pkg.strategy.targetAudience ? 80 : 20;
  let promiseClarity = pkg.topic.promise.length > 10 ? 75 : 20;
  let trustBuilding = pkg.outline.story.length > 20 ? 80 : 30;
  let contentStructure = pkg.slideOutline.length >= 6 ? 85 : 40;
  let ctaStrength = pkg.outline.cta ? 75 : 0;
  let conversionReadiness = pkg.followupSequence.length >= 5 ? 80 : 30;
  if (!pkg.outline.cta) { m.push('cta'); r.push('Webinar needs a stronger next step.'); }
  if (pkg.outline.story.length < 30) { r.push('Personal story section should be expanded.'); }
  if (pkg.topic.promise.length < 20) { r.push('Webinar title lacks a clear transformation.'); }
  const score = Math.round(audienceRelevance*0.2+promiseClarity*0.15+trustBuilding*0.2+contentStructure*0.15+ctaStrength*0.15+conversionReadiness*0.15);
  return { score, audienceRelevance, promiseClarity, trustBuilding, contentStructure, ctaStrength, conversionReadiness, missingItems: m, recommendations: r.slice(0,3) };
}
