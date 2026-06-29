import type { Timestamp } from "@nextshift/shared";
import type { Lead, LeadId, LeadStatus } from ".";

export interface LeadSearchCriteria {
  readonly status?: LeadStatus;
  readonly source?: string;
  readonly qualificationScore?: number;
}

export interface LeadRepository {
  save(lead: Lead): Promise<void>;
  findById(leadId: LeadId): Promise<Lead | null>;
  findByEmail(email: string): Promise<Lead | null>;
  findByPhone(phone: string): Promise<Lead | null>;
  search(criteria: LeadSearchCriteria): Promise<readonly Lead[]>;
  exists(leadId: LeadId): Promise<boolean>;
  close(leadId: LeadId, closedAt: Timestamp, reason?: string): Promise<Lead | null>;
}
