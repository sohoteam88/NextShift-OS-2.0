import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { ContentId } from ".";
import { createContentPlatform, type ContentPlatform } from "./calendar";
import type { ContentPlanId } from "./plan";

export type ContentVariantSetId = Brand<string, "ContentVariantSetId">;
export type ContentHook = Brand<string, "ContentHook">;
export type ContentCta = Brand<string, "ContentCta">;

export type ContentVariantSetStatus = "active" | "archived";
export type ContentVariantStatus = "draft" | "approved" | "archived";

export type ContentVariantFormat =
  | "long_post"
  | "reel"
  | "short_video"
  | "carousel"
  | "story"
  | "image_note";

export type ContentCtaType =
  | "engagement"
  | "dm_whatsapp"
  | "lead_magnet"
  | "webinar"
  | "application"
  | "sales_call";

export interface ContentVariantSnapshot {
  readonly platform: ContentPlatform;
  readonly format: ContentVariantFormat;
  readonly hook: ContentHook;
  readonly body?: string;
  readonly cta: ContentCta;
  readonly ctaType: ContentCtaType;
  readonly status: ContentVariantStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly approvedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface ContentVariantSetSnapshot {
  readonly variantSetId: ContentVariantSetId;
  readonly businessId: BusinessId;
  readonly planId: ContentPlanId;
  readonly contentId: ContentId;
  readonly status: ContentVariantSetStatus;
  readonly variants: readonly ContentVariantSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateContentVariantSetInput {
  readonly variantSetId: ContentVariantSetId;
  readonly businessId: BusinessId;
  readonly planId: ContentPlanId;
  readonly contentId: ContentId;
  readonly createdAt: Timestamp;
}

export interface AddContentVariantInput {
  readonly platform: string;
  readonly format: string;
  readonly hook: string;
  readonly body?: string;
  readonly cta: string;
  readonly ctaType: string;
  readonly createdAt: Timestamp;
}

export interface UpdateContentVariantInput {
  readonly platform: string;
  readonly format?: string;
  readonly hook?: string;
  readonly body?: string;
  readonly cta?: string;
  readonly ctaType?: string;
  readonly updatedAt: Timestamp;
}

export interface ContentVariantEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentVariantEventType;
  readonly aggregateId: ContentVariantSetId;
  readonly aggregateType: "ContentVariantSet";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentVariantEventType =
  | "ContentVariantSetCreated"
  | "ContentVariantAdded"
  | "ContentVariantUpdated"
  | "ContentVariantApproved"
  | "ContentVariantArchived"
  | "ContentVariantSetArchived"
  | "ContentVariantSetRestored";

export interface ContentVariantSetCreatedEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantSetCreated";
  readonly payload: {
    readonly variantSetId: ContentVariantSetId;
    readonly businessId: BusinessId;
    readonly planId: ContentPlanId;
    readonly contentId: ContentId;
    readonly createdAt: Timestamp;
  };
}

export interface ContentVariantAddedEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantAdded";
  readonly payload: ContentVariantSnapshot;
}

export interface ContentVariantUpdatedEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantUpdated";
  readonly payload: {
    readonly platform: ContentPlatform;
    readonly updatedFields: readonly string[];
    readonly updatedAt: Timestamp;
  };
}

export interface ContentVariantApprovedEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantApproved";
  readonly payload: {
    readonly platform: ContentPlatform;
    readonly approvedAt: Timestamp;
  };
}

export interface ContentVariantArchivedEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantArchived";
  readonly payload: {
    readonly platform: ContentPlatform;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentVariantSetArchivedEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantSetArchived";
  readonly payload: {
    readonly variantSetId: ContentVariantSetId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentVariantSetRestoredEvent
  extends ContentVariantEventMetadata {
  readonly eventType: "ContentVariantSetRestored";
  readonly payload: {
    readonly variantSetId: ContentVariantSetId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentVariantDomainEvent =
  | ContentVariantSetCreatedEvent
  | ContentVariantAddedEvent
  | ContentVariantUpdatedEvent
  | ContentVariantApprovedEvent
  | ContentVariantArchivedEvent
  | ContentVariantSetArchivedEvent
  | ContentVariantSetRestoredEvent;

export class ContentVariantSet {
  private constructor(private snapshot: ContentVariantSetSnapshot) {}

  static create(input: CreateContentVariantSetInput): ContentVariantSet {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentVariantSet({
      variantSetId: input.variantSetId,
      businessId: input.businessId,
      planId: input.planId,
      contentId: input.contentId,
      status: "active",
      variants: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentVariantSetSnapshot): ContentVariantSet {
    validateSnapshot(snapshot);
    return new ContentVariantSet(cloneSnapshot(snapshot));
  }

  get variantSetId(): ContentVariantSetId {
    return this.snapshot.variantSetId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get planId(): ContentPlanId {
    return this.snapshot.planId;
  }

  get contentId(): ContentId {
    return this.snapshot.contentId;
  }

  get status(): ContentVariantSetStatus {
    return this.snapshot.status;
  }

  addVariant(input: AddContentVariantInput): void {
    this.assertActive();

    const platform = createContentPlatform(input.platform);
    this.assertNoActiveVariant(platform);

    const timestamp = createTimestamp(input.createdAt, "createdAt");
    const variant: ContentVariantSnapshot = {
      platform,
      format: createContentVariantFormat(input.format),
      hook: createContentHook(input.hook),
      body: normalizeOptionalText(input.body),
      cta: createContentCta(input.cta),
      ctaType: createContentCtaType(input.ctaType),
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.replace({
      ...this.snapshot,
      variants: Object.freeze([...this.snapshot.variants, variant]),
      updatedAt: timestamp,
    });
  }

  updateVariant(input: UpdateContentVariantInput): readonly string[] {
    this.assertActive();

    const platform = createContentPlatform(input.platform);
    const variant = this.findVariant(platform, "draft");
    const updatedAt = createTimestamp(input.updatedAt, "updatedAt");
    const updatedFields = collectUpdatedFields(input);

    this.replaceVariant(variant, {
      ...variant,
      format:
        input.format === undefined
          ? variant.format
          : createContentVariantFormat(input.format),
      hook:
        input.hook === undefined ? variant.hook : createContentHook(input.hook),
      body:
        input.body === undefined ? variant.body : normalizeOptionalText(input.body),
      cta: input.cta === undefined ? variant.cta : createContentCta(input.cta),
      ctaType:
        input.ctaType === undefined
          ? variant.ctaType
          : createContentCtaType(input.ctaType),
      updatedAt,
    });

    return updatedFields;
  }

  approveVariant(platform: string, approvedAt: Timestamp): void {
    this.assertActive();

    const normalizedPlatform = createContentPlatform(platform);
    const variant = this.findVariant(normalizedPlatform, "draft");
    const timestamp = createTimestamp(approvedAt, "approvedAt");

    this.replaceVariant(variant, {
      ...variant,
      status: "approved",
      approvedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  archiveVariant(platform: string, archivedAt: Timestamp): void {
    this.assertActive();

    const normalizedPlatform = createContentPlatform(platform);
    const variant = this.findVariant(normalizedPlatform);
    const timestamp = createTimestamp(archivedAt, "archivedAt");

    this.replaceVariant(variant, {
      ...variant,
      status: "archived",
      archivedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  archive(archivedAt: Timestamp): void {
    if (this.snapshot.status === "archived") {
      return;
    }

    const timestamp = createTimestamp(archivedAt, "archivedAt");

    this.replace({
      ...this.snapshot,
      status: "archived",
      archivedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  restore(restoredAt: Timestamp): void {
    if (this.snapshot.status !== "archived") {
      return;
    }

    const timestamp = createTimestamp(restoredAt, "restoredAt");

    this.replace({
      ...this.snapshot,
      status: "active",
      archivedAt: undefined,
      updatedAt: timestamp,
    });
  }

  getVariant(platform: string): ContentVariantSnapshot | null {
    const normalizedPlatform = createContentPlatform(platform);
    const variant = this.snapshot.variants.find(
      (candidate) => candidate.platform === normalizedPlatform
    );

    return variant ? cloneVariant(variant) : null;
  }

  listVariants(): readonly ContentVariantSnapshot[] {
    return cloneVariants(this.snapshot.variants);
  }

  toSnapshot(): ContentVariantSetSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertActive(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content variant sets cannot be modified.");
    }
  }

  private assertNoActiveVariant(platform: ContentPlatform): void {
    if (
      this.snapshot.variants.some(
        (variant) =>
          variant.platform === platform && variant.status !== "archived"
      )
    ) {
      throw new Error("Content variant already exists for this platform.");
    }
  }

  private findVariant(
    platform: ContentPlatform,
    status?: ContentVariantStatus
  ): ContentVariantSnapshot {
    const variant = this.snapshot.variants.find(
      (candidate) =>
        candidate.platform === platform &&
        (status === undefined ? true : candidate.status === status)
    );

    if (!variant) {
      throw new Error("Content variant was not found.");
    }

    return variant;
  }

  private replaceVariant(
    current: ContentVariantSnapshot,
    next: ContentVariantSnapshot
  ): void {
    this.replace({
      ...this.snapshot,
      variants: Object.freeze(
        this.snapshot.variants.map((variant) =>
          variant === current ? next : variant
        )
      ),
      updatedAt: next.updatedAt,
    });
  }

  private replace(snapshot: ContentVariantSetSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createContentHook(hook: string): ContentHook {
  const normalized = hook.trim();

  if (normalized.length === 0) {
    throw new Error("Content variant hook is required.");
  }

  return normalized as ContentHook;
}

export function createContentCta(cta: string): ContentCta {
  const normalized = cta.trim();

  if (normalized.length === 0) {
    throw new Error("Content variant CTA is required.");
  }

  return normalized as ContentCta;
}

export function createContentVariantFormat(
  format: string
): ContentVariantFormat {
  const normalized = format.trim().toLowerCase();

  if (!isContentVariantFormat(normalized)) {
    throw new Error(`Unsupported content variant format: ${format}.`);
  }

  return normalized;
}

export function createContentCtaType(ctaType: string): ContentCtaType {
  const normalized = ctaType.trim().toLowerCase();

  if (!isContentCtaType(normalized)) {
    throw new Error(`Unsupported content CTA type: ${ctaType}.`);
  }

  return normalized;
}

function isContentVariantFormat(value: string): value is ContentVariantFormat {
  return [
    "long_post",
    "reel",
    "short_video",
    "carousel",
    "story",
    "image_note",
  ].includes(value);
}

function isContentCtaType(value: string): value is ContentCtaType {
  return [
    "engagement",
    "dm_whatsapp",
    "lead_magnet",
    "webinar",
    "application",
    "sales_call",
  ].includes(value);
}

function collectUpdatedFields(
  input: UpdateContentVariantInput
): readonly string[] {
  const fields: string[] = [];

  if (input.format !== undefined) fields.push("format");
  if (input.hook !== undefined) fields.push("hook");
  if (input.body !== undefined) fields.push("body");
  if (input.cta !== undefined) fields.push("cta");
  if (input.ctaType !== undefined) fields.push("ctaType");

  return fields;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content variant ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: ContentVariantSetSnapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content variant sets require archivedAt.");
  }

  for (const variant of snapshot.variants) {
    createContentPlatform(variant.platform);
    createContentVariantFormat(variant.format);
    createContentHook(variant.hook);
    createContentCta(variant.cta);
    createContentCtaType(variant.ctaType);
    createTimestamp(variant.createdAt, "createdAt");
    createTimestamp(variant.updatedAt, "updatedAt");

    if (variant.status === "approved" && !variant.approvedAt) {
      throw new Error("Approved content variants require approvedAt.");
    }

    if (variant.status === "archived" && !variant.archivedAt) {
      throw new Error("Archived content variants require archivedAt.");
    }
  }
}

function cloneSnapshot(
  snapshot: ContentVariantSetSnapshot
): ContentVariantSetSnapshot {
  return {
    ...snapshot,
    variants: cloneVariants(snapshot.variants),
  };
}

function cloneVariants(
  variants: readonly ContentVariantSnapshot[]
): readonly ContentVariantSnapshot[] {
  return Object.freeze(variants.map((variant) => cloneVariant(variant)));
}

function cloneVariant(variant: ContentVariantSnapshot): ContentVariantSnapshot {
  return { ...variant };
}
