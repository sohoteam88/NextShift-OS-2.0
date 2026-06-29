import type { Timestamp } from "@nextshift/shared";
import type { Customer, CustomerId, CustomerStatus, CustomerType } from ".";

export interface CustomerSearchCriteria {
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly status?: CustomerStatus;
  readonly type?: CustomerType;
}

export interface CustomerRepository {
  save(customer: Customer): Promise<void>;
  findById(customerId: CustomerId): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByPhone(phone: string): Promise<Customer | null>;
  search(criteria: CustomerSearchCriteria): Promise<readonly Customer[]>;
  exists(customerId: CustomerId): Promise<boolean>;
  archive(customerId: CustomerId, archivedAt: Timestamp): Promise<Customer | null>;
}
