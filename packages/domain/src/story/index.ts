import type { BusinessId, EventId, StoryId, Timestamp } from "@nextshift/shared";

export interface Story {
  readonly storyId: StoryId;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly summary: string;
  readonly relatedEventIds?: readonly EventId[];
  readonly createdAt: Timestamp;
}
