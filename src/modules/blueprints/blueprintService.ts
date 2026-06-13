// Blueprint Service — registry, installer, state management
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { BlueprintDefinition, BlueprintInstallState } from './types';
import { HERBALIFE_BLUEPRINT } from './blueprints/herbalifeBlueprint';

const REGISTRY: Record<string, BlueprintDefinition> = {
  herbalife_v1: HERBALIFE_BLUEPRINT,
};

export const blueprintService = {
  getAvailable(): BlueprintDefinition[] {
    return Object.values(REGISTRY);
  },

  get(id: string): BlueprintDefinition | null {
    return REGISTRY[id] ?? null;
  },

  async install(userId: string, tenantId: string, blueprintId: string): Promise<BlueprintInstallState> {
    const bp = REGISTRY[blueprintId];
    if (!bp) throw new Error(`Blueprint not found: ${blueprintId}`);

    const ctx = await getBrandContext(userId);
    const state: BlueprintInstallState = {
      blueprintId, installedAt: new Date().toISOString(),
      status: 'installed', activatedFunnels: bp.supportedFunnels, brandDNAGenerated: !!ctx,
    };

    // Store blueprint in BrandProfile if exists, otherwise metadata
    const bpRecord = await prisma.brandProfile.findUnique({ where: { userId } });
    if (bpRecord) {
      await prisma.brandProfile.update({
        where: { userId },
        data: {
          brandPositioning: bp.brandDNA.brandPositioning,
          targetAudience: bp.brandDNA.targetAudience,
          contentTone: bp.brandDNA.contentTone,
          primaryOffer: bp.brandDNA.primaryOffer,
          slogan: bp.brandDNA.slogan,
          brandColors: bp.brandDNA.brandColors as unknown as Prisma.InputJsonValue,
          contentPillars: bp.funnels.retail.contentPillars as unknown as Prisma.InputJsonValue,
        },
      });
    }

    // Store installation state in metadata
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({
      where: { id: userId },
      data: { metadata: { ...meta, blueprint_state: state as unknown as Prisma.InputJsonValue, blueprint_funnels: bp.funnels as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue },
    });

    return state;
  },

  async getInstallState(userId: string): Promise<BlueprintInstallState | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const state = meta.blueprint_state;
    return state && typeof state === 'object' ? (state as BlueprintInstallState) : null;
  },
};
