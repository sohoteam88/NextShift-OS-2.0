import type { BusinessBrainContract } from "@nextshift/contracts";
import type {
  BrandDNA,
  BusinessGoalsProfile,
  BusinessIdentity,
  BusinessProfile,
  BusinessTwinActivation,
  BusinessUnderstanding,
  CustomerProfile,
  OfferProfile,
} from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationContext } from "../context";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;

const defaultNow: Now = () => new Date().toISOString();

export interface CreateBusinessProfileCommand extends ApplicationCommand {
  readonly commandType: "CreateBusinessProfile";
  readonly identity: BusinessIdentity;
}

export interface CreateBusinessProfileResult {
  readonly profile: BusinessProfile;
}

export interface GetBusinessProfileQuery extends ApplicationQuery {
  readonly queryType: "GetBusinessProfile";
}

export interface GetBusinessProfileResult {
  readonly profile: BusinessProfile | null;
}

export interface UpdateBrandProfileCommand extends ApplicationCommand {
  readonly commandType: "UpdateBrandProfile";
  readonly brand: BrandDNA;
}

export interface UpdateBrandProfileResult {
  readonly profile: BusinessProfile;
}

export interface GetBrandProfileQuery extends ApplicationQuery {
  readonly queryType: "GetBrandProfile";
}

export interface GetBrandProfileResult {
  readonly brand: BrandDNA | null;
}

export interface UpdateOfferProfileCommand extends ApplicationCommand {
  readonly commandType: "UpdateOfferProfile";
  readonly offer: OfferProfile;
}

export interface UpdateOfferProfileResult {
  readonly profile: BusinessProfile;
}

export interface GetOfferProfileQuery extends ApplicationQuery {
  readonly queryType: "GetOfferProfile";
}

export interface GetOfferProfileResult {
  readonly offer: OfferProfile | null;
}

export interface UpdateCustomerProfileCommand extends ApplicationCommand {
  readonly commandType: "UpdateCustomerProfile";
  readonly customer: CustomerProfile;
}

export interface UpdateCustomerProfileResult {
  readonly profile: BusinessProfile;
}

export interface GetCustomerProfileQuery extends ApplicationQuery {
  readonly queryType: "GetCustomerProfile";
}

export interface GetCustomerProfileResult {
  readonly customer: CustomerProfile | null;
}

export interface UpdateBusinessGoalsCommand extends ApplicationCommand {
  readonly commandType: "UpdateBusinessGoals";
  readonly goals: BusinessGoalsProfile;
}

export interface UpdateBusinessGoalsResult {
  readonly profile: BusinessProfile;
}

export interface GetBusinessGoalsQuery extends ApplicationQuery {
  readonly queryType: "GetBusinessGoals";
}

export interface GetBusinessGoalsResult {
  readonly goals: BusinessGoalsProfile | null;
}

export interface GenerateBusinessUnderstandingCommand
  extends ApplicationCommand {
  readonly commandType: "GenerateBusinessUnderstanding";
}

export interface GenerateBusinessUnderstandingResult {
  readonly profile: BusinessProfile;
}

export interface GetBusinessUnderstandingQuery extends ApplicationQuery {
  readonly queryType: "GetBusinessUnderstanding";
}

export interface GetBusinessUnderstandingResult {
  readonly understanding: BusinessUnderstanding | null;
}

export interface ActivateBusinessTwinCommand extends ApplicationCommand {
  readonly commandType: "ActivateBusinessTwin";
}

export interface ActivateBusinessTwinResult {
  readonly profile: BusinessProfile;
}

export interface GetBusinessTwinStatusQuery extends ApplicationQuery {
  readonly queryType: "GetBusinessTwinStatus";
}

export interface GetBusinessTwinStatusResult {
  readonly activation: BusinessTwinActivation | null;
}

export class CreateBusinessProfileUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    command: CreateBusinessProfileCommand
  ): Promise<Result<CreateBusinessProfileResult>> {
    const result = await this.businessBrain.createBusinessProfile({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      identity: command.identity,
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }

}

export class GetBusinessProfileUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetBusinessProfileQuery
  ): Promise<Result<GetBusinessProfileResult>> {
    const result = await this.businessBrain.getBusinessProfile({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class UpdateBrandProfileUseCase {
  constructor(
    private readonly businessBrain: BusinessBrainContract,
    private readonly now: Now = defaultNow
  ) {}

  async execute(
    command: UpdateBrandProfileCommand
  ): Promise<Result<UpdateBrandProfileResult>> {
    const result = await this.businessBrain.updateBrandProfile({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      brand: command.brand,
      updatedAt: this.now(),
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class GetBrandProfileUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetBrandProfileQuery
  ): Promise<Result<GetBrandProfileResult>> {
    const result = await this.businessBrain.getBrandProfile({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ brand: result.value });
  }
}

export class UpdateOfferProfileUseCase {
  constructor(
    private readonly businessBrain: BusinessBrainContract,
    private readonly now: Now = defaultNow
  ) {}

  async execute(
    command: UpdateOfferProfileCommand
  ): Promise<Result<UpdateOfferProfileResult>> {
    const result = await this.businessBrain.updateOfferProfile({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      offer: command.offer,
      updatedAt: this.now(),
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class GetOfferProfileUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetOfferProfileQuery
  ): Promise<Result<GetOfferProfileResult>> {
    const result = await this.businessBrain.getOfferProfile({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ offer: result.value });
  }
}

export class UpdateCustomerProfileUseCase {
  constructor(
    private readonly businessBrain: BusinessBrainContract,
    private readonly now: Now = defaultNow
  ) {}

  async execute(
    command: UpdateCustomerProfileCommand
  ): Promise<Result<UpdateCustomerProfileResult>> {
    const result = await this.businessBrain.updateCustomerProfile({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      customer: command.customer,
      updatedAt: this.now(),
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class GetCustomerProfileUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetCustomerProfileQuery
  ): Promise<Result<GetCustomerProfileResult>> {
    const result = await this.businessBrain.getCustomerProfile({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ customer: result.value });
  }
}

export class UpdateBusinessGoalsUseCase {
  constructor(
    private readonly businessBrain: BusinessBrainContract,
    private readonly now: Now = defaultNow
  ) {}

  async execute(
    command: UpdateBusinessGoalsCommand
  ): Promise<Result<UpdateBusinessGoalsResult>> {
    const result = await this.businessBrain.updateBusinessGoals({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      goals: command.goals,
      updatedAt: this.now(),
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class GetBusinessGoalsUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetBusinessGoalsQuery
  ): Promise<Result<GetBusinessGoalsResult>> {
    const result = await this.businessBrain.getBusinessGoals({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ goals: result.value });
  }
}

export class GenerateBusinessUnderstandingUseCase {
  constructor(
    private readonly businessBrain: BusinessBrainContract,
    private readonly now: Now = defaultNow
  ) {}

  async execute(
    command: GenerateBusinessUnderstandingCommand
  ): Promise<Result<GenerateBusinessUnderstandingResult>> {
    const result = await this.businessBrain.generateBusinessUnderstanding({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      generatedAt: this.now(),
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class GetBusinessUnderstandingUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetBusinessUnderstandingQuery
  ): Promise<Result<GetBusinessUnderstandingResult>> {
    const result = await this.businessBrain.getBusinessUnderstanding({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ understanding: result.value });
  }
}

export class ActivateBusinessTwinUseCase {
  constructor(
    private readonly businessBrain: BusinessBrainContract,
    private readonly now: Now = defaultNow
  ) {}

  async execute(
    command: ActivateBusinessTwinCommand
  ): Promise<Result<ActivateBusinessTwinResult>> {
    const result = await this.businessBrain.activateBusinessTwin({
      businessId: command.context.businessId,
      tenant: command.context.tenant,
      activatedAt: this.now(),
      source: mapActorToSource(command.context),
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ profile: result.value });
  }
}

export class GetBusinessTwinStatusUseCase {
  constructor(private readonly businessBrain: BusinessBrainContract) {}

  async execute(
    query: GetBusinessTwinStatusQuery
  ): Promise<Result<GetBusinessTwinStatusResult>> {
    const result = await this.businessBrain.getBusinessTwinStatus({
      businessId: query.context.businessId,
      tenant: query.context.tenant,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success({ activation: result.value });
  }
}

function mapActorToSource(
  context: ApplicationContext
): "user" | "agent" | "system" {
  if (context.actor.actorType === "agent") {
    return "agent";
  }

  if (context.actor.actorType === "system") {
    return "system";
  }

  return "user";
}
