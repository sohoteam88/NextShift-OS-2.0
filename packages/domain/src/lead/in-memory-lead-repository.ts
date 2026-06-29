import type { Timestamp } from "@nextshift/shared";
import { Lead } from ".";
import type { LeadId, LeadSnapshot } from ".";
import type { LeadRepository, LeadSearchCriteria } from "./lead-repository";

export class InMemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<LeadId, LeadSnapshot>();

  async save(lead: Lead): Promise<void> {
    const snapshot = lead.toSnapshot();
    this.leads.set(snapshot.leadId, cloneSnapshot(snapshot));
  }

  async findById(leadId: LeadId): Promise<Lead | null> {
    const snapshot = this.leads.get(leadId);
    return snapshot ? Lead.rehydrate(snapshot) : null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const normalized = email.trim().toLowerCase();
    const snapshot = [...this.leads.values()].find(
      (lead) => lead.email === normalized
    );

    return snapshot ? Lead.rehydrate(snapshot) : null;
  }

  async findByPhone(phone: string): Promise<Lead | null> {
    const normalized = phone.trim();
    const snapshot = [...this.leads.values()].find(
      (lead) => lead.phone === normalized
    );

    return snapshot ? Lead.rehydrate(snapshot) : null;
  }

  async search(criteria: LeadSearchCriteria): Promise<readonly Lead[]> {
    return [...this.leads.values()]
      .filter((lead) => matchesCriteria(lead, criteria))
      .sort(compareLeads)
      .map((lead) => Lead.rehydrate(lead));
  }

  async exists(leadId: LeadId): Promise<boolean> {
    return this.leads.has(leadId);
  }

  async close(
    leadId: LeadId,
    closedAt: Timestamp,
    reason?: string
  ): Promise<Lead | null> {
    const lead = await this.findById(leadId);

    if (!lead) {
      return null;
    }

    lead.close(closedAt, reason);
    await this.save(lead);

    return lead;
  }
}

function cloneSnapshot(snapshot: LeadSnapshot): LeadSnapshot {
  return { ...snapshot };
}

function matchesCriteria(
  lead: LeadSnapshot,
  criteria: LeadSearchCriteria
): boolean {
  if (criteria.status && lead.status !== criteria.status) {
    return false;
  }

  if (
    criteria.source &&
    !lead.source.toLowerCase().includes(criteria.source.trim().toLowerCase())
  ) {
    return false;
  }

  return !(
    criteria.qualificationScore !== undefined &&
    lead.qualificationScore !== criteria.qualificationScore
  );
}

function compareLeads(left: LeadSnapshot, right: LeadSnapshot): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}
