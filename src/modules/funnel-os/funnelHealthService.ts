// Funnel Health Service — health score per funnel
import type { FunnelHealth } from './types';

export async function calculateFunnelHealth(
  contentCount: number, videoCount: number,
  funnelExists: boolean, leadCount: number, customerCount: number,
): Promise<FunnelHealth> {
  const traffic = funnelExists ? (leadCount > 0 ? 75 : 40) : 10;
  const content = contentCount >= 10 ? 85 : contentCount >= 3 ? 55 : contentCount > 0 ? 30 : 0;
  const conversion = customerCount > 0 ? 80 : leadCount > 5 ? 50 : leadCount > 0 ? 25 : 0;
  const followUp = leadCount > 0 ? 60 : 10;
  const pipeline = leadCount > 0 ? 70 : 10;

  const overallScore = Math.round(traffic * 0.2 + content * 0.25 + conversion * 0.25 + followUp * 0.15 + pipeline * 0.15);

  return { traffic, content, conversion, followUp, pipeline, overallScore };
}
