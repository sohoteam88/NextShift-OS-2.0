import type {
  Revenue,
  RevenueId,
  RevenuePeriod,
  RevenueRepository,
  RevenueSearchCriteria,
  RevenueSummary,
} from "@nextshift/domain";
import { Revenue as RevenueAggregate } from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateRevenueId = () => RevenueId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateRevenueId: CreateRevenueId = () =>
  crypto.randomUUID() as RevenueId;

export interface CreateRevenueCommand extends ApplicationCommand {
  readonly commandType: "CreateRevenue";
  readonly revenueId?: RevenueId;
  readonly source: string;
  readonly period: RevenuePeriod;
  readonly summary: RevenueSummary;
}

export interface RecordRevenueCommand extends ApplicationCommand {
  readonly commandType: "RecordRevenue";
  readonly revenueId: RevenueId;
}

export interface RecognizeRevenueCommand extends ApplicationCommand {
  readonly commandType: "RecognizeRevenue";
  readonly revenueId: RevenueId;
}

export interface ArchiveRevenueCommand extends ApplicationCommand {
  readonly commandType: "ArchiveRevenue";
  readonly revenueId: RevenueId;
}

export interface GetRevenueQuery extends ApplicationQuery {
  readonly queryType: "GetRevenue";
  readonly revenueId: RevenueId;
}

export interface ListRevenueByBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListRevenueByBusiness";
}

export interface SearchRevenueQuery extends ApplicationQuery {
  readonly queryType: "SearchRevenue";
  readonly criteria: RevenueSearchCriteria;
}

export interface RevenueApplicationResult {
  readonly revenue: Revenue;
}

export interface RevenueQueryResult {
  readonly revenue: Revenue | null;
}

export interface RevenueListQueryResult {
  readonly revenue: readonly Revenue[];
}

export interface RevenueApplicationError {
  readonly code:
    | "RevenueNotFound"
    | "ValidationFailed"
    | "RevenuePersistenceFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class RevenueApplicationService {
  constructor(
    private readonly revenueRepository: RevenueRepository,
    private readonly now: Now = defaultNow,
    private readonly createRevenueId: CreateRevenueId = defaultCreateRevenueId
  ) {}

  async createRevenue(
    command: CreateRevenueCommand
  ): Promise<Result<RevenueApplicationResult, RevenueApplicationError>> {
    try {
      const revenueId = command.revenueId ?? this.createRevenueId();
      assertRevenueId(revenueId);

      if (await this.revenueRepository.exists(revenueId)) {
        throw new Error(`Revenue ${revenueId} already exists.`);
      }

      const createdAt = this.now();
      const revenue = RevenueAggregate.create({
        revenueId,
        businessId: command.context.businessId,
        source: command.source,
        period: command.period,
        summary: command.summary,
        createdAt,
      });

      await this.revenueRepository.save(revenue);

      return success({ revenue });
    } catch (error) {
      return failure(mapRevenueApplicationError(error));
    }
  }

  async recordRevenue(
    command: RecordRevenueCommand
  ): Promise<Result<RevenueApplicationResult, RevenueApplicationError>> {
    return this.mutateRevenue(command, (revenue, recordedAt) => {
      revenue.record(recordedAt);
    });
  }

  async recognizeRevenue(
    command: RecognizeRevenueCommand
  ): Promise<Result<RevenueApplicationResult, RevenueApplicationError>> {
    return this.mutateRevenue(command, (revenue, recognizedAt) => {
      revenue.recognize(recognizedAt);
    });
  }

  async archiveRevenue(
    command: ArchiveRevenueCommand
  ): Promise<Result<RevenueApplicationResult, RevenueApplicationError>> {
    return this.mutateRevenue(command, (revenue, archivedAt) => {
      revenue.archive(archivedAt);
    });
  }

  async getRevenue(query: GetRevenueQuery): Promise<RevenueQueryResult> {
    const revenue = await this.revenueRepository.findById(query.revenueId);

    if (!revenue || revenue.businessId !== query.context.businessId) {
      return { revenue: null };
    }

    return { revenue };
  }

  async listRevenueByBusiness(
    query: ListRevenueByBusinessQuery
  ): Promise<RevenueListQueryResult> {
    return {
      revenue: await this.revenueRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async searchRevenue(
    query: SearchRevenueQuery
  ): Promise<RevenueListQueryResult> {
    return {
      revenue: await this.revenueRepository.search({
        ...query.criteria,
        businessId: query.context.businessId,
      }),
    };
  }

  private async mutateRevenue(
    command: ApplicationCommand & { readonly revenueId: RevenueId },
    mutate: (revenue: Revenue, occurredAt: Timestamp) => void
  ): Promise<Result<RevenueApplicationResult, RevenueApplicationError>> {
    try {
      assertRevenueId(command.revenueId);

      const revenue = await this.revenueRepository.findById(command.revenueId);

      if (!revenue || revenue.businessId !== command.context.businessId) {
        return failure(revenueNotFound(command.revenueId));
      }

      mutate(revenue, this.now());

      await this.revenueRepository.save(revenue);

      return success({ revenue });
    } catch (error) {
      return failure(mapRevenueApplicationError(error));
    }
  }
}

function assertRevenueId(revenueId: RevenueId): void {
  if (revenueId.trim().length === 0) {
    throw new Error("Revenue ID is required.");
  }
}

function revenueNotFound(revenueId: RevenueId): RevenueApplicationError {
  return {
    code: "RevenueNotFound",
    message: `Revenue ${revenueId} was not found.`,
  };
}

function mapRevenueApplicationError(
  error: unknown
): RevenueApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Revenue command failed validation.",
    cause: error,
  };
}
