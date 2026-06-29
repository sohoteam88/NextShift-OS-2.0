import type {
  Campaign,
  CampaignId,
  CampaignRepository,
  CampaignSearchCriteria,
} from "@nextshift/domain";
import { Campaign as CampaignAggregate } from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateCampaignId = () => CampaignId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateCampaignId: CreateCampaignId = () =>
  crypto.randomUUID() as CampaignId;

export interface CreateCampaignCommand extends ApplicationCommand {
  readonly commandType: "CreateCampaign";
  readonly campaignId?: CampaignId;
  readonly name: string;
  readonly objective: string;
  readonly channels?: readonly string[];
}

export interface UpdateCampaignCommand extends ApplicationCommand {
  readonly commandType: "UpdateCampaign";
  readonly campaignId: CampaignId;
  readonly name?: string;
  readonly objective?: string;
  readonly channels?: readonly string[];
}

export interface LaunchCampaignCommand extends ApplicationCommand {
  readonly commandType: "LaunchCampaign";
  readonly campaignId: CampaignId;
}

export interface PauseCampaignCommand extends ApplicationCommand {
  readonly commandType: "PauseCampaign";
  readonly campaignId: CampaignId;
}

export interface ResumeCampaignCommand extends ApplicationCommand {
  readonly commandType: "ResumeCampaign";
  readonly campaignId: CampaignId;
}

export interface CompleteCampaignCommand extends ApplicationCommand {
  readonly commandType: "CompleteCampaign";
  readonly campaignId: CampaignId;
}

export interface ArchiveCampaignCommand extends ApplicationCommand {
  readonly commandType: "ArchiveCampaign";
  readonly campaignId: CampaignId;
}

export interface RestoreCampaignCommand extends ApplicationCommand {
  readonly commandType: "RestoreCampaign";
  readonly campaignId: CampaignId;
}

export interface GetCampaignQuery extends ApplicationQuery {
  readonly queryType: "GetCampaign";
  readonly campaignId: CampaignId;
}

export interface ListCampaignsByBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListCampaignsByBusiness";
}

export interface SearchCampaignsQuery extends ApplicationQuery {
  readonly queryType: "SearchCampaigns";
  readonly criteria: CampaignSearchCriteria;
}

export interface CampaignApplicationResult {
  readonly campaign: Campaign;
}

export interface CampaignQueryResult {
  readonly campaign: Campaign | null;
}

export interface CampaignListQueryResult {
  readonly campaigns: readonly Campaign[];
}

export interface CampaignApplicationError {
  readonly code:
    | "CampaignNotFound"
    | "ValidationFailed"
    | "CampaignPersistenceFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class CampaignApplicationService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly now: Now = defaultNow,
    private readonly createCampaignId: CreateCampaignId = defaultCreateCampaignId
  ) {}

  async createCampaign(
    command: CreateCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    try {
      const createdAt = this.now();
      const campaign = CampaignAggregate.create({
        campaignId: command.campaignId ?? this.createCampaignId(),
        businessId: command.context.businessId,
        name: command.name,
        objective: command.objective,
        channels: command.channels,
        createdAt,
      });

      await this.campaignRepository.save(campaign);

      return success({ campaign });
    } catch (error) {
      return failure(mapCampaignApplicationError(error));
    }
  }

  async updateCampaign(
    command: UpdateCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, updatedAt) => {
      campaign.update({
        name: command.name,
        objective: command.objective,
        channels: command.channels,
        updatedAt,
      });
    });
  }

  async launchCampaign(
    command: LaunchCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, launchedAt) => {
      campaign.launch(launchedAt);
    });
  }

  async pauseCampaign(
    command: PauseCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, pausedAt) => {
      campaign.pause(pausedAt);
    });
  }

  async resumeCampaign(
    command: ResumeCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, resumedAt) => {
      campaign.resume(resumedAt);
    });
  }

  async completeCampaign(
    command: CompleteCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, completedAt) => {
      campaign.complete(completedAt);
    });
  }

  async archiveCampaign(
    command: ArchiveCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, archivedAt) => {
      campaign.archive(archivedAt);
    });
  }

  async restoreCampaign(
    command: RestoreCampaignCommand
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    return this.mutateCampaign(command, (campaign, restoredAt) => {
      campaign.restore(restoredAt);
    });
  }

  async getCampaign(query: GetCampaignQuery): Promise<CampaignQueryResult> {
    return {
      campaign: await this.campaignRepository.findById(query.campaignId),
    };
  }

  async listCampaignsByBusiness(
    query: ListCampaignsByBusinessQuery
  ): Promise<CampaignListQueryResult> {
    return {
      campaigns: await this.campaignRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async searchCampaigns(
    query: SearchCampaignsQuery
  ): Promise<CampaignListQueryResult> {
    return {
      campaigns: await this.campaignRepository.search(query.criteria),
    };
  }

  private async mutateCampaign(
    command: ApplicationCommand & { readonly campaignId: CampaignId },
    mutate: (campaign: Campaign, occurredAt: Timestamp) => void
  ): Promise<Result<CampaignApplicationResult, CampaignApplicationError>> {
    try {
      const campaign = await this.campaignRepository.findById(command.campaignId);

      if (!campaign) {
        return failure(campaignNotFound(command.campaignId));
      }

      const occurredAt = this.now();
      mutate(campaign, occurredAt);

      await this.campaignRepository.save(campaign);

      return success({ campaign });
    } catch (error) {
      return failure(mapCampaignApplicationError(error));
    }
  }
}

function campaignNotFound(campaignId: CampaignId): CampaignApplicationError {
  return {
    code: "CampaignNotFound",
    message: `Campaign ${campaignId} was not found.`,
  };
}

function mapCampaignApplicationError(
  error: unknown
): CampaignApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Campaign command failed validation.",
    cause: error,
  };
}
