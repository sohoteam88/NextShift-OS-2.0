import type { Timestamp } from "@nextshift/shared";
import { Customer } from ".";
import type { CustomerId, CustomerSnapshot } from ".";
import type {
  CustomerRepository,
  CustomerSearchCriteria,
} from "./customer-repository";

export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<CustomerId, CustomerSnapshot>();

  async save(customer: Customer): Promise<void> {
    const snapshot = customer.toSnapshot();
    this.customers.set(snapshot.customerId, cloneSnapshot(snapshot));
  }

  async findById(customerId: CustomerId): Promise<Customer | null> {
    const snapshot = this.customers.get(customerId);
    return snapshot ? Customer.rehydrate(snapshot) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const normalized = email.trim().toLowerCase();
    const snapshot = [...this.customers.values()].find(
      (customer) => customer.email === normalized
    );

    return snapshot ? Customer.rehydrate(snapshot) : null;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const normalized = phone.trim();
    const snapshot = [...this.customers.values()].find(
      (customer) => customer.phone === normalized
    );

    return snapshot ? Customer.rehydrate(snapshot) : null;
  }

  async search(criteria: CustomerSearchCriteria): Promise<readonly Customer[]> {
    return [...this.customers.values()]
      .filter((customer) => matchesCriteria(customer, criteria))
      .sort(compareCustomers)
      .map((customer) => Customer.rehydrate(customer));
  }

  async exists(customerId: CustomerId): Promise<boolean> {
    return this.customers.has(customerId);
  }

  async archive(
    customerId: CustomerId,
    archivedAt: Timestamp
  ): Promise<Customer | null> {
    const customer = await this.findById(customerId);

    if (!customer) {
      return null;
    }

    customer.archive(archivedAt);
    await this.save(customer);

    return customer;
  }
}

function cloneSnapshot(snapshot: CustomerSnapshot): CustomerSnapshot {
  return {
    ...snapshot,
    tags: [...snapshot.tags],
  };
}

function matchesCriteria(
  customer: CustomerSnapshot,
  criteria: CustomerSearchCriteria
): boolean {
  if (
    criteria.displayName &&
    !customer.displayName
      .toLowerCase()
      .includes(criteria.displayName.trim().toLowerCase())
  ) {
    return false;
  }

  if (
    criteria.email &&
    !customer.email?.includes(criteria.email.trim().toLowerCase())
  ) {
    return false;
  }

  if (criteria.phone && !customer.phone?.includes(criteria.phone.trim())) {
    return false;
  }

  if (criteria.status && customer.status !== criteria.status) {
    return false;
  }

  return !(criteria.type && customer.type !== criteria.type);
}

function compareCustomers(left: CustomerSnapshot, right: CustomerSnapshot): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}
