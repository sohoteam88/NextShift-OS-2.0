import type {
  Campaign,
  CampaignExecution,
  CampaignExecutionId,
  CampaignExecutionRepository,
  CampaignId,
  CampaignRepository,
  CampaignScheduleRepository,
} from "@nextshift/domain";
import {
  assertCampaignCanStartExecution,
  CampaignExecution as CampaignExecutionAggregate,
} from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateCampaignExecutionId = () => CampaignExecutionId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateCampaignExecutionId: CreateCampaignExecutionId = () =>
  crypto.randomUUID() as CampaignExecutionId;

export interface StartCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "StartCampaignExecution";
  readonly campaignId: CampaignId;
  readonly executionId?: CampaignExecutionId;
  readonly explicitlyEligible?: boolean;
}

export interface CompleteCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "CompleteCampaignExecution";
  readonly campaignId: CampaignId;
}

export interface FailCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "FailCampaignExecution";
  readonly campaignId: CampaignId;
  readonly failureReason?: string;
}

export interface CancelCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "CancelCampaignExecution";
  readonly campaignId: CampaignId;
}

export interface GetCampaignExecutionQuery extends ApplicationQuery {
  readonly queryType: "GetCampaignExecution";
  readonly campaignId: CampaignId;
}

export interface ListActiveCampaignExecutionsQuery extends ApplicationQuery {
  readonly queryType: "ListActiveCampaignExecutions";
}

export interface ListCampaignExecutionHistoryQuery extends ApplicationQuery {
  readonly queryType: "ListCampaignExecutionHistory";
  readonly campaignId: CampaignId;
}

export interface CampaignExecutionApplicationResult {
  readonly execution: CampaignExecution;
}

export interface CampaignExecutionQueryResult {
  readonly execution: CampaignExecution | null;
}

export interface CampaignExecutionListQueryResult {
  readonly executions: readonly CampaignExecution[];
}

export interface CampaignExecutionApplicationError {
  readonly code:
    | "CampaignNotFound"
    | "CampaignExecutionNotFound"
    | "ValidationFailed"
    | "CampaignExecutionPersistenceFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class CampaignExecutionApplicationService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly scheduleRepository: CampaignScheduleRepository,
    private readonly executionRepository: CampaignExecutionRepository,
    private readonly now: Now = defaultNow,
    private readonly createExecutionId: CreateCampaignExecutionId =
      defaultCreateCampaignExecutionId
  ) {}

  async startCampaignExecution(
    command: StartCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const campaign = await this.getCampaignForCommand(command.campaignId);

      if (!campaign) {
        return failure(campaignNotFound(command.campaignId));
      }

      this.assertBusinessAccess(campaign, command);

      const activeExecution =
        await this.executionRepository.findActiveByCampaignId(
          command.campaignId
        );

      if (activeExecution) {
        throw new Error("Campaign already has an active execution.");
      }

      const activeSchedule = await this.scheduleRepository.findActiveByCampaignId(
        command.campaignId
      );

      assertCampaignCanStartExecution({
        campaignStatus: campaign.status,
        hasActiveSchedule: activeSchedule !== null,
        explicitlyEligible: command.explicitlyEligible,
      });

      const startedAt = this.now();
      const execution = CampaignExecutionAggregate.create({
        executionId: command.executionId ?? this.createExecutionId(),
        campaignId: command.campaignId,
        businessId: campaign.businessId,
        createdAt: startedAt,
      });

      execution.start(startedAt);

      await this.executionRepository.save(execution);

      return success({ execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async completeCampaignExecution(
    command: CompleteCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    return this.mutateActiveExecution(command, (execution, occurredAt) => {
      execution.complete(occurredAt);
    });
  }

  async failCampaignExecution(
    command: FailCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    return this.mutateActiveExecution(command, (execution, occurredAt) => {
      execution.fail(occurredAt, command.failureReason);
    });
  }

  async cancelCampaignExecution(
    command: CancelCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    return this.mutateActiveExecution(command, (execution, occurredAt) => {
      execution.cancel(occurredAt);
    });
  }

  async getCampaignExecution(
    query: GetCampaignExecutionQuery
  ): Promise<CampaignExecutionQueryResult> {
    const execution = await this.executionRepository.findActiveByCampaignId(
      query.campaignId
    );

    if (!execution || execution.businessId !== query.context.businessId) {
      return { execution: null };
    }

    return { execution };
  }

  async listActiveCampaignExecutions(
    query: ListActiveCampaignExecutionsQuery
  ): Promise<CampaignExecutionListQueryResult> {
    return {
      executions: await this.executionRepository.listActive(
        query.context.businessId
      ),
    };
  }

  async listCampaignExecutionHistory(
    query: ListCampaignExecutionHistoryQuery
  ): Promise<CampaignExecutionListQueryResult> {
    const campaign = await this.campaignRepository.findById(query.campaignId);

    if (!campaign || campaign.businessId !== query.context.businessId) {
      return { executions: [] };
    }

    return {
      executions: await this.executionRepository.listHistory(query.campaignId),
    };
  }

  private async mutateActiveExecution(
    command: ApplicationCommand & { readonly campaignId: CampaignId },
    mutate: (execution: CampaignExecution, occurredAt: Timestamp) => void
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const execution = await this.executionRepository.findActiveByCampaignId(
        command.campaignId
      );

      if (!execution) {
        return failure(campaignExecutionNotFound(command.campaignId));
      }

      this.assertExecutionBusinessAccess(execution, command);

      mutate(execution, this.now());

      await this.executionRepository.save(execution);

      return success({ execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  private async getCampaignForCommand(
    campaignId: CampaignId
  ): Promise<Campaign | null> {
    return this.campaignRepository.findById(campaignId);
  }

  private assertBusinessAccess(
    campaign: Campaign,
    command: ApplicationCommand
  ): void {
    if (campaign.businessId !== command.context.businessId) {
      throw new Error("Campaign does not belong to the command context.");
    }
  }

  private assertExecutionBusinessAccess(
    execution: CampaignExecution,
    command: ApplicationCommand
  ): void {
    if (execution.businessId !== command.context.businessId) {
      throw new Error(
        "Campaign execution does not belong to the command context."
      );
    }
  }
}

function campaignNotFound(
  campaignId: CampaignId
): CampaignExecutionApplicationError {
  return {
    code: "CampaignNotFound",
    message: `Campaign ${campaignId} was not found.`,
  };
}

function campaignExecutionNotFound(
  campaignId: CampaignId
): CampaignExecutionApplicationError {
  return {
    code: "CampaignExecutionNotFound",
    message: `Campaign ${campaignId} does not have an active execution.`,
  };
}

function mapCampaignExecutionApplicationError(
  error: unknown
): CampaignExecutionApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Campaign execution command failed validation.",
    cause: error,
  };
}
