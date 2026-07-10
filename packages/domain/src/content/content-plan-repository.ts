import type { BusinessId } from "@nextshift/shared";
import type { ContentCalendarId } from "./calendar";
import type {
  ContentPlan,
  ContentPlanId,
  PlannedContentSnapshot,
} from "./plan";

export interface ContentPlanRepository {
  save(plan: ContentPlan): Promise<void>;
  findById(planId: ContentPlanId): Promise<ContentPlan | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly ContentPlan[]>;
  findByCalendarId(
    calendarId: ContentCalendarId
  ): Promise<readonly ContentPlan[]>;
  findPendingApprovals(
    businessId: BusinessId
  ): Promise<readonly ContentPlan[]>;
  findApproved(businessId: BusinessId): Promise<readonly ContentPlan[]>;
  listEntries(planId: ContentPlanId): Promise<readonly PlannedContentSnapshot[]>;
  exists(planId: ContentPlanId): Promise<boolean>;
}
