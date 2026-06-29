import type {
  CommunicationPreference,
  Customer,
  CustomerId,
  CustomerRepository,
  CustomerSearchCriteria,
  CustomerStatus,
  CustomerType,
  FollowUp,
  FollowUpId,
  FollowUpPriority,
  FollowUpRepository,
  FollowUpStatus,
  Interaction,
  InteractionId,
  InteractionRepository,
  InteractionType,
  Lead,
  LeadId,
  LeadRepository,
  LeadSearchCriteria,
  LeadStatus,
  Segment,
  SegmentId,
  SegmentMembershipSnapshot,
  SegmentRepository,
  SegmentRule,
  SegmentStatus,
} from "@nextshift/domain";
import type { BusinessId, Timestamp } from "@nextshift/shared";

export interface CustomerSummary {
  readonly customerId: CustomerId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly status: CustomerStatus;
  readonly type: CustomerType;
  readonly communicationPreference: CommunicationPreference;
  readonly tags: readonly string[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface LeadSummary {
  readonly leadId: LeadId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source: string;
  readonly status: LeadStatus;
  readonly qualificationScore?: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface InteractionSummary {
  readonly interactionId: InteractionId;
  readonly customerId: CustomerId;
  readonly interactionType: InteractionType;
  readonly interactionChannel: string;
  readonly outcome?: string;
  readonly note?: string;
  readonly occurredAt: Timestamp;
  readonly recordedBy: string;
}

export interface TimelineEntry extends InteractionSummary {}

export interface FollowUpSummary {
  readonly followUpId: FollowUpId;
  readonly customerId: CustomerId;
  readonly interactionId?: InteractionId;
  readonly title: string;
  readonly description?: string;
  readonly priority: FollowUpPriority;
  readonly status: FollowUpStatus;
  readonly dueAt: Timestamp;
  readonly completedAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
  readonly assignedTo?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface SegmentMemberSummary {
  readonly customerId: CustomerId;
  readonly assignedAt: Timestamp;
  readonly assignmentSource: SegmentMembershipSnapshot["assignmentSource"];
}

export interface SegmentSummary {
  readonly segmentId: SegmentId;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly description?: string;
  readonly rule: SegmentRule;
  readonly status: SegmentStatus;
  readonly memberCount: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CustomerQueryFilters extends CustomerSearchCriteria {}
export interface LeadQueryFilters extends LeadSearchCriteria {}

export interface FollowUpQueryFilters {
  readonly customerId?: CustomerId;
  readonly status?: FollowUpStatus;
  readonly priority?: FollowUpPriority;
  readonly dueAt?: Timestamp;
}

export interface SegmentQueryFilters {
  readonly businessId?: BusinessId;
}

export class CRMQueryService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly leadRepository: LeadRepository,
    private readonly interactionRepository: InteractionRepository,
    private readonly followUpRepository: FollowUpRepository,
    private readonly segmentRepository: SegmentRepository
  ) {}

  async searchCustomers(
    filters: CustomerQueryFilters = {}
  ): Promise<readonly CustomerSummary[]> {
    return freezeList(
      (await this.customerRepository.search(filters)).map(toCustomerSummary)
    );
  }

  async getCustomerById(
    customerId: CustomerId
  ): Promise<CustomerSummary | null> {
    const customer = await this.customerRepository.findById(customerId);
    return customer ? toCustomerSummary(customer) : null;
  }

  async getCustomerByEmail(email: string): Promise<CustomerSummary | null> {
    const customer = await this.customerRepository.findByEmail(email);
    return customer ? toCustomerSummary(customer) : null;
  }

  async getCustomerByPhone(phone: string): Promise<CustomerSummary | null> {
    const customer = await this.customerRepository.findByPhone(phone);
    return customer ? toCustomerSummary(customer) : null;
  }

  async searchLeads(
    filters: LeadQueryFilters = {}
  ): Promise<readonly LeadSummary[]> {
    return freezeList(
      (await this.leadRepository.search(filters)).map(toLeadSummary)
    );
  }

  async getLeadById(leadId: LeadId): Promise<LeadSummary | null> {
    const lead = await this.leadRepository.findById(leadId);
    return lead ? toLeadSummary(lead) : null;
  }

  async getCustomerTimeline(
    customerId: CustomerId
  ): Promise<readonly TimelineEntry[]> {
    return freezeList(
      (await this.interactionRepository.timeline(customerId)).map(
        toInteractionSummary
      )
    );
  }

  async getInteractionById(
    interactionId: InteractionId
  ): Promise<InteractionSummary | null> {
    const interaction = await this.interactionRepository.findById(interactionId);
    return interaction ? toInteractionSummary(interaction) : null;
  }

  async listPendingFollowUps(
    filters: FollowUpQueryFilters = {}
  ): Promise<readonly FollowUpSummary[]> {
    return freezeList(
      (await this.followUpRepository.findPending())
        .map(toFollowUpSummary)
        .filter((followUp) => matchesFollowUpFilters(followUp, filters))
    );
  }

  async listOverdueFollowUps(
    asOf: Timestamp,
    filters: FollowUpQueryFilters = {}
  ): Promise<readonly FollowUpSummary[]> {
    return freezeList(
      (await this.followUpRepository.findOverdue(asOf))
        .map(toFollowUpSummary)
        .filter((followUp) => matchesFollowUpFilters(followUp, filters))
    );
  }

  async getFollowUpById(
    followUpId: FollowUpId
  ): Promise<FollowUpSummary | null> {
    const followUp = await this.followUpRepository.findById(followUpId);
    return followUp ? toFollowUpSummary(followUp) : null;
  }

  async listSegments(
    filters: SegmentQueryFilters = {}
  ): Promise<readonly SegmentSummary[]> {
    return freezeList(
      (await this.segmentRepository.list(filters.businessId)).map(
        toSegmentSummary
      )
    );
  }

  async getSegmentById(segmentId: SegmentId): Promise<SegmentSummary | null> {
    const segment = await this.segmentRepository.findById(segmentId);
    return segment ? toSegmentSummary(segment) : null;
  }

  async listSegmentMembers(
    segmentId: SegmentId
  ): Promise<readonly SegmentMemberSummary[]> {
    return freezeList(
      (await this.segmentRepository.listMembers(segmentId)).map(
        toSegmentMemberSummary
      )
    );
  }

  async listCustomerSegments(
    customerId: CustomerId
  ): Promise<readonly SegmentSummary[]> {
    return freezeList(
      (await this.segmentRepository.listCustomerSegments(customerId)).map(
        toSegmentSummary
      )
    );
  }
}

function toCustomerSummary(customer: Customer): CustomerSummary {
  const snapshot = customer.toSnapshot();

  return Object.freeze({
    customerId: snapshot.customerId,
    businessId: snapshot.businessId,
    displayName: snapshot.displayName,
    email: snapshot.email,
    phone: snapshot.phone,
    status: snapshot.status,
    type: snapshot.type,
    communicationPreference: snapshot.communicationPreference,
    tags: Object.freeze([...snapshot.tags]),
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  });
}

function toLeadSummary(lead: Lead): LeadSummary {
  const snapshot = lead.toSnapshot();

  return Object.freeze({
    leadId: snapshot.leadId,
    businessId: snapshot.businessId,
    displayName: snapshot.displayName,
    email: snapshot.email,
    phone: snapshot.phone,
    source: snapshot.source,
    status: snapshot.status,
    qualificationScore: snapshot.qualificationScore,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  });
}

function toInteractionSummary(interaction: Interaction): InteractionSummary {
  const snapshot = interaction.toSnapshot();

  return Object.freeze({
    interactionId: snapshot.interactionId,
    customerId: snapshot.customerId,
    interactionType: snapshot.interactionType,
    interactionChannel: snapshot.interactionChannel,
    outcome: snapshot.outcome,
    note: snapshot.note,
    occurredAt: snapshot.occurredAt,
    recordedBy: snapshot.recordedBy,
  });
}

function toFollowUpSummary(followUp: FollowUp): FollowUpSummary {
  const snapshot = followUp.toSnapshot();

  return Object.freeze({
    followUpId: snapshot.followUpId,
    customerId: snapshot.customerId,
    interactionId: snapshot.interactionId,
    title: snapshot.title,
    description: snapshot.description,
    priority: snapshot.priority,
    status: snapshot.status,
    dueAt: snapshot.dueAt,
    completedAt: snapshot.completedAt,
    cancelledAt: snapshot.cancelledAt,
    assignedTo: snapshot.assignedTo,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  });
}

function toSegmentSummary(segment: Segment): SegmentSummary {
  const snapshot = segment.toSnapshot();

  return Object.freeze({
    segmentId: snapshot.segmentId,
    businessId: snapshot.businessId,
    name: snapshot.name,
    description: snapshot.description,
    rule: Object.freeze({
      ruleType: snapshot.rule.ruleType,
      criteria:
        snapshot.rule.criteria === undefined
          ? undefined
          : Object.freeze({ ...snapshot.rule.criteria }),
    }),
    status: snapshot.status,
    memberCount: snapshot.memberships.filter((membership) => !membership.removedAt)
      .length,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  });
}

function toSegmentMemberSummary(
  member: SegmentMembershipSnapshot
): SegmentMemberSummary {
  return Object.freeze({
    customerId: member.customerId,
    assignedAt: member.assignedAt,
    assignmentSource: member.assignmentSource,
  });
}

function matchesFollowUpFilters(
  followUp: FollowUpSummary,
  filters: FollowUpQueryFilters
): boolean {
  if (filters.customerId && followUp.customerId !== filters.customerId) {
    return false;
  }

  if (filters.status && followUp.status !== filters.status) {
    return false;
  }

  if (filters.priority && followUp.priority !== filters.priority) {
    return false;
  }

  return !(filters.dueAt && followUp.dueAt !== filters.dueAt);
}

function freezeList<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}
