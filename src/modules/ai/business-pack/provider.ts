import type { BusinessPackSlice } from '../generation/types';
import { businessPack } from './loader';
import type { BusinessPackTrack, BusinessPackVisibility } from './types';

type PublicGenerationTrack = Exclude<BusinessPackTrack, 'both'>;

export interface GetBusinessPackSliceOptions {
  track: PublicGenerationTrack;
  platform?: string;
}

function isInScope(
  entry: { track: BusinessPackTrack; visibility: BusinessPackVisibility },
  track: PublicGenerationTrack,
): boolean {
  return entry.visibility === 'public' && (entry.track === track || entry.track === 'both');
}

function applyPublicSubstitutions(text: string, track: PublicGenerationTrack): string {
  return businessPack.substitutionTable
    .filter((entry) => isInScope(entry, track))
    .reduce((result, entry) => result.replaceAll(entry.internalTerm, entry.publicTerm), text);
}

/**
 * Returns only destination-safe, track-scoped business context for shared AI
 * generation. Private data stays in the JSON asset for future private paths.
 */
export function getBusinessPackSlice(options: GetBusinessPackSliceOptions): BusinessPackSlice {
  const { track, platform } = options;
  const productLines = businessPack.productLines.filter((entry) => isInScope(entry, track));
  const trackScripts = Object.values(businessPack.tracks)
    .flat()
    .filter((entry) => isInScope(entry, track));
  const objections = businessPack.objections.filter((entry) => isInScope(entry, track));
  const complianceRules = businessPack.complianceRedLines.filter((entry) => isInScope(entry, track));
  const publicTerms = businessPack.substitutionTable
    .filter((entry) => isInScope(entry, track))
    .map((entry) => entry.publicTerm);

  const sections = [
    `【版本】事业包 v${businessPack.version}`,
    `【适用范围】${track === 'retail' ? '零售内容' : '招募内容'}${platform ? `；平台：${platform}` : ''}`,
    publicTerms.length > 0 ? `【对外称呼】${publicTerms.join('、')}` : '',
    ...productLines.map((entry) => [
      `【${entry.title}】`,
      ...entry.products.map((product) => `${product.name}：${product.role}${product.flavours ? `；口味：${product.flavours.join('、')}` : ''}`),
      entry.complianceNote ?? '',
    ].filter(Boolean).join('\n')),
    ...trackScripts.map((entry) => [
      `【${entry.title}】`,
      entry.originalQuote ?? '',
      `要点：${entry.structure.join('；')}`,
      entry.complianceNote ?? entry.promptGuidance ?? '',
    ].filter(Boolean).join('\n')),
    ...objections.map((entry) => [
      `【异议：${entry.title}】`,
      entry.originalQuote ?? '',
      `结构：${entry.structure.join('；')}`,
      entry.complianceNote ?? '',
    ].filter(Boolean).join('\n')),
    ...complianceRules.map((entry) => `【${entry.destination}】${entry.rule}`),
  ].filter(Boolean);

  return {
    promptContext: applyPublicSubstitutions(sections.join('\n\n'), track),
    metadata: {
      version: businessPack.version,
      track,
      visibility: 'public',
      ...(platform ? { platform } : {}),
    },
  };
}
