import type {
  Campaign,
  CampaignId,
  CampaignRepository,
  CampaignSchedule,
  CampaignScheduleId,
  CampaignScheduleRepository,
} from "@nextshift/domain";
import { CampaignSchedule as CampaignScheduleAggregate } from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateCampaignScheduleId = () => CampaignScheduleId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateCampaignScheduleId: CreateCampaignScheduleId = () =>
  crypto.randomUUID() as CampaignScheduleId;

export interface ScheduleCampaignLaunchCommand extends ApplicationCommand {
  readonly commandType: "ScheduleCampaignLaunch";
  readonly campaignId: CampaignId;
  readonly scheduleId?: CampaignScheduleId;
  readonly scheduledFor: Timestamp;
}

export interface RescheduleCampaignLaunchCommand extends ApplicationCommand {
  readonly commandType: "RescheduleCampaignLaunch";
  readonly campaignId: CampaignId;
  readonly scheduledFor: Timestamp;
}

export interface CancelCampaignLaunchScheduleCommand
  extends ApplicationCommand {
  readonly commandType: "CancelCampaignLaunchSchedule";
  readonly campaignId: CampaignId;
}

export interface GetCampaignScheduleQuery extends ApplicationQuery {
  readonly queryType: "GetCampaignSchedule";
  readonly campaignId: CampaignId;
}

export interface ListPendingCampaignSchedulesQuery extends ApplicationQuery {
  readonly queryType: "ListPendingCampaignSchedules";
}

export interface CampaignScheduleApplicationResult {
  readonly schedule: CampaignSchedule;
}

export interface CampaignScheduleQueryResult {
  readonly schedule: CampaignSchedule | null;
}

export interface CampaignScheduleListQueryResult {
  readonly schedules: readonly CampaignSchedule[];
}

export interface CampaignScheduleApplicationError {
  readonly code:
    | "CampaignNotFound"
    | "CampaignScheduleNotFound"
    | "ValidationFailed"
    | "CampaignSchedulePersistenceFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class CampaignSchedulingApplicationService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly scheduleRepository: CampaignScheduleRepository,
    private readonly now: Now = defaultNow,
    private readonly createScheduleId: CreateCampaignScheduleId =
      defaultCreateCampaignScheduleId
  ) {}

  async scheduleCampaignLaunch(
    command: ScheduleCampaignLaunchCommand
  ): Promise<
    Result<CampaignScheduleApplicationResult, CampaignScheduleApplicationError>
  > {
    try {
      const campaign = await this.getCampaignForCommand(command.campaignId);

      if (!campaign) {
        return failure(campaignNotFound(command.campaignId));
      }

      this.assertBusinessAccess(campaign, command);

      const existing = await this.scheduleRepository.findActiveByCampaignId(
        command.campaignId
      );

      if (existing) {
        throw new Error("Campaign already has an active launch schedule.");
      }

      const createdAt = this.now();
      const schedule = CampaignScheduleAggregate.schedule({
        scheduleId: command.scheduleId ?? this.createScheduleId(),
        campaignId: command.campaignId,
        businessId: campaign.businessId,
        campaignStatus: campaign.status,
        scheduledFor: command.scheduledFor,
        createdAt,
      });

      await this.scheduleRepository.save(schedule);

      return success({ schedule });
    } catch (error) {
      return failure(mapCampaignScheduleApplicationError(error));
    }
  }

  async rescheduleCampaignLaunch(
    command: RescheduleCampaignLaunchCommand
  ): Promise<
    Result<CampaignScheduleApplicationResult, CampaignScheduleApplicationError>
  > {
    try {
      const campaign = await this.getCampaignForCommand(command.campaignId);

      if (!campaign) {
        return failure(campaignNotFound(command.campaignId));
      }

      this.assertBusinessAccess(campaign, command);

      const schedule = await this.scheduleRepository.findActiveByCampaignId(
        command.campaignId
      );

      if (!schedule) {
        return failure(campaignScheduleNotFound(command.campaignId));
      }

      schedule.reschedule({
        campaignStatus: campaign.status,
        scheduledFor: command.scheduledFor,
        rescheduledAt: this.now(),
      });

      await this.scheduleRepository.save(schedule);

      return success({ schedule });
    } catch (error) {
      return failure(mapCampaignScheduleApplicationError(error));
    }
  }

  async cancelCampaignLaunchSchedule(
    command: CancelCampaignLaunchScheduleCommand
  ): Promise<
    Result<CampaignScheduleApplicationResult, CampaignScheduleApplicationError>
  > {
    try {
      const schedule = await this.scheduleRepository.findActiveByCampaignId(
        command.campaignId
      );

      if (!schedule) {
        return failure(campaignScheduleNotFound(command.campaignId));
      }

      this.assertScheduleBusinessAccess(schedule, command);

      schedule.cancel(this.now());

      await this.scheduleRepository.save(schedule);

      return success({ schedule });
    } catch (error) {
      return failure(mapCampaignScheduleApplicationError(error));
    }
  }

  async getCampaignSchedule(
    query: GetCampaignScheduleQuery
  ): Promise<CampaignScheduleQueryResult> {
    const schedule = await this.scheduleRepository.findActiveByCampaignId(
      query.campaignId
    );

    if (!schedule || schedule.businessId !== query.context.businessId) {
      return { schedule: null };
    }

    return { schedule };
  }

  async listPendingCampaignSchedules(
    query: ListPendingCampaignSchedulesQuery
  ): Promise<CampaignScheduleListQueryResult> {
    return {
      schedules: await this.scheduleRepository.findPendingByBusinessId(
        query.context.businessId,
        this.now()
      ),
    };
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

  private assertScheduleBusinessAccess(
    schedule: CampaignSchedule,
    command: ApplicationCommand
  ): void {
    if (schedule.businessId !== command.context.businessId) {
      throw new Error(
        "Campaign launch schedule does not belong to the command context."
      );
    }
  }
}

function campaignNotFound(
  campaignId: CampaignId
): CampaignScheduleApplicationError {
  return {
    code: "CampaignNotFound",
    message: `Campaign ${campaignId} was not found.`,
  };
}

function campaignScheduleNotFound(
  campaignId: CampaignId
): CampaignScheduleApplicationError {
  return {
    code: "CampaignScheduleNotFound",
    message: `Campaign ${campaignId} does not have an active launch schedule.`,
  };
}

function mapCampaignScheduleApplicationError(
  error: unknown
): CampaignScheduleApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Campaign schedule command failed validation.",
    cause: error,
  };
}
