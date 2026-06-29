import type {
  RevenueTarget,
  RevenueTargetId,
  RevenueTargetPeriod,
  RevenueTargetRepository,
  RevenueTargetSearchCriteria,
  RevenueTargetSummary,
} from "@nextshift/domain";
import { RevenueTarget as RevenueTargetAggregate } from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateRevenueTargetId = () => RevenueTargetId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateRevenueTargetId: CreateRevenueTargetId = () =>
  crypto.randomUUID() as RevenueTargetId;

export interface CreateRevenueTargetCommand extends ApplicationCommand {
  readonly commandType: "CreateRevenueTarget";
  readonly revenueTargetId?: RevenueTargetId;
  readonly name: string;
  readonly period: RevenueTargetPeriod;
  readonly summary: RevenueTargetSummary;
}

export interface UpdateRevenueTargetCommand extends ApplicationCommand {
  readonly commandType: "UpdateRevenueTarget";
  readonly revenueTargetId: RevenueTargetId;
  readonly name?: string;
  readonly period?: RevenueTargetPeriod;
  readonly summary?: RevenueTargetSummary;
}

export interface ArchiveRevenueTargetCommand extends ApplicationCommand {
  readonly commandType: "ArchiveRevenueTarget";
  readonly revenueTargetId: RevenueTargetId;
}

export interface GetRevenueTargetQuery extends ApplicationQuery {
  readonly queryType: "GetRevenueTarget";
  readonly revenueTargetId: RevenueTargetId;
}

export interface ListRevenueTargetsByBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListRevenueTargetsByBusiness";
}

export interface SearchRevenueTargetsQuery extends ApplicationQuery {
  readonly queryType: "SearchRevenueTargets";
  readonly criteria: RevenueTargetSearchCriteria;
}

export interface RevenueTargetApplicationResult {
  readonly target: RevenueTarget;
}

export interface RevenueTargetQueryResult {
  readonly target: RevenueTarget | null;
}

export interface RevenueTargetListQueryResult {
  readonly targets: readonly RevenueTarget[];
}

export interface RevenueTargetApplicationError {
  readonly code:
    | "RevenueTargetNotFound"
    | "ValidationFailed"
    | "RevenueTargetPersistenceFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class RevenueTargetApplicationService {
  constructor(
    private readonly targetRepository: RevenueTargetRepository,
    private readonly now: Now = defaultNow,
    private readonly createRevenueTargetId: CreateRevenueTargetId =
      defaultCreateRevenueTargetId
  ) {}

  async createRevenueTarget(
    command: CreateRevenueTargetCommand
  ): Promise<
    Result<RevenueTargetApplicationResult, RevenueTargetApplicationError>
  > {
    try {
      const revenueTargetId =
        command.revenueTargetId ?? this.createRevenueTargetId();
      assertRevenueTargetId(revenueTargetId);

      if (await this.targetRepository.exists(revenueTargetId)) {
        throw new Error(`Revenue target ${revenueTargetId} already exists.`);
      }

      const createdAt = this.now();
      const target = RevenueTargetAggregate.create({
        revenueTargetId,
        businessId: command.context.businessId,
        name: command.name,
        period: command.period,
        summary: command.summary,
        createdAt,
      });

      await this.targetRepository.save(target);

      return success({ target });
    } catch (error) {
      return failure(mapRevenueTargetApplicationError(error));
    }
  }

  async updateRevenueTarget(
    command: UpdateRevenueTargetCommand
  ): Promise<
    Result<RevenueTargetApplicationResult, RevenueTargetApplicationError>
  > {
    return this.mutateRevenueTarget(command, (target, updatedAt) => {
      target.update({
        name: command.name,
        period: command.period,
        summary: command.summary,
        updatedAt,
      });
    });
  }

  async archiveRevenueTarget(
    command: ArchiveRevenueTargetCommand
  ): Promise<
    Result<RevenueTargetApplicationResult, RevenueTargetApplicationError>
  > {
    return this.mutateRevenueTarget(command, (target, archivedAt) => {
      target.archive(archivedAt);
    });
  }

  async getRevenueTarget(
    query: GetRevenueTargetQuery
  ): Promise<RevenueTargetQueryResult> {
    const target = await this.targetRepository.findById(query.revenueTargetId);

    if (!target || target.businessId !== query.context.businessId) {
      return { target: null };
    }

    return { target };
  }

  async listRevenueTargetsByBusiness(
    query: ListRevenueTargetsByBusinessQuery
  ): Promise<RevenueTargetListQueryResult> {
    return {
      targets: await this.targetRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async searchRevenueTargets(
    query: SearchRevenueTargetsQuery
  ): Promise<RevenueTargetListQueryResult> {
    return {
      targets: await this.targetRepository.search({
        ...query.criteria,
        businessId: query.context.businessId,
      }),
    };
  }

  private async mutateRevenueTarget(
    command: ApplicationCommand & { readonly revenueTargetId: RevenueTargetId },
    mutate: (target: RevenueTarget, occurredAt: Timestamp) => void
  ): Promise<
    Result<RevenueTargetApplicationResult, RevenueTargetApplicationError>
  > {
    try {
      assertRevenueTargetId(command.revenueTargetId);

      const target = await this.targetRepository.findById(
        command.revenueTargetId
      );

      if (!target || target.businessId !== command.context.businessId) {
        return failure(revenueTargetNotFound(command.revenueTargetId));
      }

      mutate(target, this.now());

      await this.targetRepository.save(target);

      return success({ target });
    } catch (error) {
      return failure(mapRevenueTargetApplicationError(error));
    }
  }
}

function assertRevenueTargetId(revenueTargetId: RevenueTargetId): void {
  if (revenueTargetId.trim().length === 0) {
    throw new Error("Revenue target ID is required.");
  }
}

function revenueTargetNotFound(
  revenueTargetId: RevenueTargetId
): RevenueTargetApplicationError {
  return {
    code: "RevenueTargetNotFound",
    message: `Revenue target ${revenueTargetId} was not found.`,
  };
}

function mapRevenueTargetApplicationError(
  error: unknown
): RevenueTargetApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Revenue target command failed validation.",
    cause: error,
  };
}
