import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentAsset,
  InMemoryContentRepository,
  type ContentId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const contentId = "content-1" as ContentId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createContent(): ContentAsset {
  return ContentAsset.create({
    contentId,
    businessId,
    type: "social_post",
    category: "education",
    title: "How to choose your first CRM",
    body: "A practical guide for small teams.",
    tags: ["crm", "crm", " education "],
    createdAt,
  });
}

describe("ContentAsset aggregate", () => {
  it("creates a draft content asset", () => {
    const content = createContent();

    expect(content.toSnapshot()).toMatchObject({
      contentId,
      businessId,
      type: "social_post",
      category: "education",
      title: "How to choose your first CRM",
      body: "A practical guide for small teams.",
      status: "draft",
      tags: ["crm", "education"],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("fails without a title", () => {
    expect(() =>
      ContentAsset.create({
        contentId,
        businessId,
        type: "social_post",
        title: " ",
        createdAt,
      })
    ).toThrow("Content title is required.");
  });

  it("rejects unsupported content types and categories", () => {
    expect(() =>
      ContentAsset.create({
        contentId,
        businessId,
        type: "podcast",
        title: "Podcast idea",
        createdAt,
      })
    ).toThrow("Unsupported content type");

    expect(() =>
      ContentAsset.create({
        contentId,
        businessId,
        type: "video",
        category: "viral",
        title: "Video idea",
        createdAt,
      })
    ).toThrow("Unsupported content category");
  });

  it("updates content metadata", () => {
    const content = createContent();

    content.update({
      type: "video",
      category: "authority",
      title: "CRM mistakes founders make",
      body: "Updated body.",
      tags: ["authority"],
      updatedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(content.toSnapshot()).toMatchObject({
      type: "video",
      category: "authority",
      title: "CRM mistakes founders make",
      body: "Updated body.",
      tags: ["authority"],
      updatedAt: "2026-06-27T01:00:00.000Z",
    });
  });

  it("publishes, archives, and restores content", () => {
    const content = createContent();

    content.publish("2026-06-27T01:00:00.000Z");
    content.archive("2026-06-27T02:00:00.000Z");
    content.restore("2026-06-27T03:00:00.000Z");

    expect(content.toSnapshot()).toMatchObject({
      status: "published",
      publishedAt: "2026-06-27T01:00:00.000Z",
      archivedAt: undefined,
      updatedAt: "2026-06-27T03:00:00.000Z",
    });
  });

  it("prevents modifying archived content", () => {
    const content = createContent();

    content.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      content.update({
        title: "Archived update",
        updatedAt: "2026-06-27T03:00:00.000Z",
      })
    ).toThrow("Archived content assets cannot be modified.");
  });
});

describe("InMemoryContentRepository", () => {
  it("saves and retrieves content by ID", async () => {
    const repository = new InMemoryContentRepository();
    const content = createContent();

    await repository.save(content);

    expect((await repository.findById(contentId))?.toSnapshot()).toEqual(
      content.toSnapshot()
    );
  });

  it("lists content by business", async () => {
    const repository = new InMemoryContentRepository();

    await repository.save(createContent());

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
  });

  it("searches by content filters", async () => {
    const repository = new InMemoryContentRepository();

    await repository.save(createContent());

    expect(
      await repository.search({
        businessId,
        type: "social_post",
        category: "education",
        status: "draft",
        title: "first crm",
      })
    ).toHaveLength(1);
  });

  it("archives content", async () => {
    const repository = new InMemoryContentRepository();

    await repository.save(createContent());
    await repository.archive(contentId, "2026-06-27T02:00:00.000Z");

    expect((await repository.findById(contentId))?.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-27T02:00:00.000Z",
    });
  });
});
