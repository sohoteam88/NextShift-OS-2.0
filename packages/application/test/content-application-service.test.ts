import {
  InMemoryContentRepository,
  type ContentDomainEvent,
  type ContentId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentApplicationService,
  type ContentEventPublisher,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const contentId = "content-1" as ContentId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentEventPublisher implements ContentEventPublisher {
  readonly events: ContentDomainEvent[] = [];

  async publish(event: ContentDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const repository = new InMemoryContentRepository();
  const publisher = new RecordingContentEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
  ];
  const service = new ContentApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T05:00:00.000Z",
    () => eventId,
    () => contentId
  );

  return { publisher, repository, service };
}

async function createContent(service: ContentApplicationService) {
  return service.createContentAsset({
    commandType: "CreateContentAsset",
    context,
    contentId,
    type: "social_post",
    category: "education",
    title: "How to choose your first CRM",
    body: "A practical guide for small teams.",
    tags: ["crm"],
  });
}

describe("ContentApplicationService", () => {
  it("creates and persists a content asset", async () => {
    const { publisher, repository, service } = createService();

    const result = await createContent(service);

    expect(result.ok).toBe(true);
    expect(await repository.exists(contentId)).toBe(true);
    expect(publisher.events[0]).toMatchObject({
      eventType: "ContentAssetCreated",
      aggregateId: contentId,
      aggregateType: "ContentAsset",
      eventId,
      correlationId,
      version: 1,
      payload: {
        contentId,
        businessId,
        type: "social_post",
        category: "education",
        title: "How to choose your first CRM",
        status: "draft",
      },
    });
  });

  it("updates content and publishes an update event", async () => {
    const { publisher, service } = createService();

    await createContent(service);

    const result = await service.updateContentAsset({
      commandType: "UpdateContentAsset",
      context,
      contentId,
      type: "video",
      category: "authority",
      title: "CRM mistakes founders make",
      tags: ["authority"],
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.content.toSnapshot()).toMatchObject({
        type: "video",
        category: "authority",
        title: "CRM mistakes founders make",
        tags: ["authority"],
      });
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "ContentAssetUpdated",
      payload: {
        contentId,
        updatedFields: ["type", "category", "title", "tags"],
      },
    });
  });

  it("publishes, archives, and restores content", async () => {
    const { publisher, service } = createService();

    await createContent(service);
    await service.publishContentAsset({
      commandType: "PublishContentAsset",
      context,
      contentId,
    });
    await service.archiveContentAsset({
      commandType: "ArchiveContentAsset",
      context,
      contentId,
      reason: "Outdated",
    });
    const result = await service.restoreContentAsset({
      commandType: "RestoreContentAsset",
      context,
      contentId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.content.toSnapshot()).toMatchObject({
        status: "published",
        archivedAt: undefined,
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentAssetCreated",
      "ContentAssetPublished",
      "ContentAssetArchived",
      "ContentAssetRestored",
    ]);
  });

  it("returns not found when updating missing content", async () => {
    const { service } = createService();

    const result = await service.updateContentAsset({
      commandType: "UpdateContentAsset",
      context,
      contentId,
      title: "Missing content",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ContentAssetNotFound",
      });
    }
  });

  it("does not publish an event when persistence fails", async () => {
    const publisher = new RecordingContentEventPublisher();
    const service = new ContentApplicationService(
      {
        async save() {
          throw new Error("save failed");
        },
        async findById() {
          return null;
        },
        async findByBusinessId() {
          return [];
        },
        async search() {
          return [];
        },
        async exists() {
          return false;
        },
        async archive() {
          return null;
        },
      },
      publisher,
      () => "2026-06-27T00:00:00.000Z",
      () => eventId,
      () => contentId
    );

    const result = await createContent(service);

    expect(result.ok).toBe(false);
    expect(publisher.events).toHaveLength(0);
  });
});
