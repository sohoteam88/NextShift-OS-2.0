import type { Timestamp } from "@nextshift/shared";
import { ContentAsset } from ".";
import type { BusinessId } from "@nextshift/shared";
import type { ContentAssetSnapshot, ContentId } from ".";
import type {
  ContentRepository,
  ContentSearchCriteria,
} from "./content-repository";

export class InMemoryContentRepository implements ContentRepository {
  private readonly content = new Map<ContentId, ContentAssetSnapshot>();

  async save(content: ContentAsset): Promise<void> {
    const snapshot = content.toSnapshot();
    this.content.set(snapshot.contentId, cloneSnapshot(snapshot));
  }

  async findById(contentId: ContentId): Promise<ContentAsset | null> {
    const snapshot = this.content.get(contentId);
    return snapshot ? ContentAsset.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentAsset[]> {
    return this.search({ businessId });
  }

  async search(
    criteria: ContentSearchCriteria
  ): Promise<readonly ContentAsset[]> {
    return [...this.content.values()]
      .filter((content) => matchesCriteria(content, criteria))
      .sort(compareContent)
      .map((content) => ContentAsset.rehydrate(content));
  }

  async exists(contentId: ContentId): Promise<boolean> {
    return this.content.has(contentId);
  }

  async archive(
    contentId: ContentId,
    archivedAt: Timestamp
  ): Promise<ContentAsset | null> {
    const content = await this.findById(contentId);

    if (!content) {
      return null;
    }

    content.archive(archivedAt);
    await this.save(content);

    return content;
  }
}

function matchesCriteria(
  content: ContentAssetSnapshot,
  criteria: ContentSearchCriteria
): boolean {
  if (criteria.businessId && content.businessId !== criteria.businessId) {
    return false;
  }

  if (criteria.type && content.type !== criteria.type) {
    return false;
  }

  if (criteria.category && content.category !== criteria.category) {
    return false;
  }

  if (criteria.status && content.status !== criteria.status) {
    return false;
  }

  return !(
    criteria.title &&
    !content.title.toLowerCase().includes(criteria.title.trim().toLowerCase())
  );
}

function compareContent(
  left: ContentAssetSnapshot,
  right: ContentAssetSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(snapshot: ContentAssetSnapshot): ContentAssetSnapshot {
  return {
    ...snapshot,
    tags: Object.freeze([...snapshot.tags]),
  };
}
