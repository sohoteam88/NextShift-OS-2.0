import type { FunnelPackage, FunnelHealth } from './types';

export function validateFunnelHealth(pkg: FunnelPackage): FunnelHealth {
  const m: string[] = []; const r: string[] = [];
  let audienceFit = pkg.landingPage.headline ? 80 : 20;
  let offerClarity = pkg.landingPage.benefits.length >= 3 ? 80 : 30;
  let pageClarity = pkg.thankYouPage.confirmation ? 75 : 10;
  let ctaStrength = pkg.landingPage.heroCta && pkg.thankYouPage.whatsappCta ? 80 : 20;
  let trustElements = pkg.landingPage.credibility ? 75 : 30;
  let followUpReadiness = pkg.emailSequence.length >= 5 ? 80 : 30;
  let trafficReadiness = pkg.adAngles.length >= 3 ? 75 : 20;
  if (!pkg.landingPage.heroCta) { m.push('heroCta'); r.push('先补上一个明确 CTA。'); }
  if (!pkg.whatsappFlow.prefilledMessage) { m.push('whatsapp'); r.push('你现在有流量入口，但没有跟进机制。'); }
  if (!pkg.thankYouPage.confirmation) { m.push('thankYou'); r.push('感谢页必须告诉用户下一步做什么。'); }
  if (pkg.adAngles.length < 3) { r.push('漏斗完成后，下一步是准备流量角度。'); }
  const score = Math.round(audienceFit*0.15+offerClarity*0.15+pageClarity*0.1+ctaStrength*0.2+trustElements*0.15+followUpReadiness*0.15+trafficReadiness*0.1);
  return { score, audienceFit, offerClarity, pageClarity, ctaStrength, trustElements, followUpReadiness, trafficReadiness, missingItems: m, recommendations: r.slice(0,3) };
}
