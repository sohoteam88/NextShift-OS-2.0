import type { BusinessTwinRepository } from '@nextshift/business-brain';
import type {
  BrandDNAContext,
  BusinessIdentityContext,
  BusinessTwinSnapshot,
} from '@nextshift/contracts';
import type { BusinessId, TenantContext, Timestamp } from '@nextshift/shared';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { BrandContext } from '@/modules/brand-dna/types';
import { interviewAuthorityService } from '@/modules/interview-authority/services/InterviewAuthorityService';
import type { InterviewAuthority } from '@/modules/interview-authority/contracts/InterviewAuthority';

type BusinessTwinRepositoryDependencies = {
  getInterviewAuthority?: typeof interviewAuthorityService.getInterviewAuthority;
  getBrandContext?: typeof getBrandContext;
  now?: () => Date;
};

export class InterviewBrandBusinessTwinRepository implements BusinessTwinRepository {
  constructor(
    private readonly userId: string,
    private readonly dependencies: BusinessTwinRepositoryDependencies = {},
  ) {}

  async getSnapshot(
    businessId: BusinessId,
    tenant: TenantContext,
  ): Promise<BusinessTwinSnapshot | null> {
    const [interviewAuthority, brandContext] = await Promise.all([
      (this.dependencies.getInterviewAuthority ?? interviewAuthorityService.getInterviewAuthority)(this.userId),
      (this.dependencies.getBrandContext ?? getBrandContext)(this.userId),
    ]);
    const identity = buildIdentityContext(interviewAuthority, brandContext);
    const brand = buildBrandDNAContext(brandContext);

    if (!identity && !brand) return null;

    return {
      businessId,
      tenant,
      version: 1,
      capturedAt: (this.dependencies.now?.() ?? new Date()).toISOString() as Timestamp,
      ...(identity ? { identity } : {}),
      ...(brand ? { brand } : {}),
    };
  }
}

export async function getBusinessTwin(userId: string, tenantId: string) {
  const tenant: TenantContext = {
    tenantId: tenantId as TenantContext['tenantId'],
  };
  const businessId = `business-${tenantId}` as BusinessId;

  return new InterviewBrandBusinessTwinRepository(userId).getSnapshot(businessId, tenant);
}

function buildIdentityContext(
  interviewAuthority: InterviewAuthority,
  brandContext: BrandContext | null,
): BusinessIdentityContext | undefined {
  const profile = interviewAuthority.profile.confidence === 'fallback'
    ? undefined
    : interviewAuthority.profile;
  const businessContext = interviewAuthority.businessContext.confidence === 'fallback'
    ? undefined
    : interviewAuthority.businessContext;
  const businessName = stringValue(brandContext?.brandName) ?? stringValue(profile?.fullName);
  const positioning = stringValue(brandContext?.positioning);
  const identity: BusinessIdentityContext = {
    ...(businessName ? { businessName } : {}),
    ...(stringValue(profile?.industry) ? { industry: stringValue(profile?.industry) } : {}),
    ...(stringValue(businessContext?.businessStage) ? { businessStage: stringValue(businessContext?.businessStage) } : {}),
    ...(stringValue(profile?.missionStatement) ? { mission: stringValue(profile?.missionStatement) } : {}),
    ...(positioning ? { positioning } : {}),
  };

  return Object.keys(identity).length > 0 ? identity : undefined;
}

function buildBrandDNAContext(brandContext: BrandContext | null): BrandDNAContext | undefined {
  if (!brandContext) return undefined;

  const brandName = stringValue(brandContext.brandName);
  const brandStory = stringValue(brandContext.messaging.elevatorPitch)
    ?? stringValue(brandContext.messaging.coreMessage);
  const voice = stringValue(brandContext.tone);
  const positioning = stringValue(brandContext.positioning);
  const brand: BrandDNAContext = {
    ...(brandName ? { brandName } : {}),
    ...(brandStory ? { brandStory } : {}),
    ...(voice ? { voice } : {}),
    ...(positioning ? { positioning } : {}),
  };

  return Object.keys(brand).length > 0 ? brand : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
