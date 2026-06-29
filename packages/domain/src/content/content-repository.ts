import type { BusinessId, Timestamp } from "@nextshift/shared";
import type {
  ContentAsset,
  ContentCategory,
  ContentId,
  ContentStatus,
  ContentType,
} from ".";

export interface ContentSearchCriteria {
  readonly businessId?: BusinessId;
  readonly type?: ContentType;
  readonly category?: ContentCategory;
  readonly status?: ContentStatus;
  readonly title?: string;
}

export interface ContentRepository {
  save(content: ContentAsset): Promise<void>;
  findById(contentId: ContentId): Promise<ContentAsset | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly ContentAsset[]>;
  search(criteria: ContentSearchCriteria): Promise<readonly ContentAsset[]>;
  exists(contentId: ContentId): Promise<boolean>;
  archive(
    contentId: ContentId,
    archivedAt: Timestamp
  ): Promise<ContentAsset | null>;
}
