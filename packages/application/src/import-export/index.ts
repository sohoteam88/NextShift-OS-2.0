import type {
  CommunicationPreference,
  CustomerId,
  CustomerType,
  LeadId,
} from "@nextshift/domain";
import type { BusinessId } from "@nextshift/shared";
import type { ApplicationContext } from "../context";
import type { CustomerApplicationService } from "../customer";
import type { LeadApplicationService } from "../lead";
import type {
  CRMQueryService,
  CustomerQueryFilters,
  LeadQueryFilters,
} from "../query";

export interface CustomerImportRecord {
  readonly customerId?: CustomerId;
  readonly businessId?: BusinessId;
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly communicationPreference?: CommunicationPreference;
  readonly tags?: readonly string[];
}

export interface LeadImportRecord {
  readonly leadId?: LeadId;
  readonly businessId?: BusinessId;
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source?: string;
}

export interface ImportRequest<TRecord> {
  readonly context: ApplicationContext;
  readonly records: readonly TRecord[];
}

export type ImportRecordStatus = "imported" | "skipped" | "failed";

export interface ImportValidationError {
  readonly recordIndex: number;
  readonly field: string;
  readonly code:
    | "Required"
    | "InvalidEmail"
    | "InvalidPhone"
    | "BusinessMismatch"
    | "DuplicateIdentifier"
    | "DuplicateEmail"
    | "DuplicatePhone"
    | "ApplicationError";
  readonly message: string;
}

export interface ImportRecordResult {
  readonly recordIndex: number;
  readonly status: ImportRecordStatus;
  readonly aggregateId?: CustomerId | LeadId;
  readonly reason?: string;
}

export interface ImportResult {
  readonly total: number;
  readonly imported: number;
  readonly skipped: number;
  readonly failed: number;
  readonly validationErrors: readonly ImportValidationError[];
  readonly records: readonly ImportRecordResult[];
}

export interface CustomerExport {
  readonly customerId: CustomerId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly status: string;
  readonly type: CustomerType;
  readonly communicationPreference: CommunicationPreference;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LeadExport {
  readonly leadId: LeadId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source: string;
  readonly status: string;
  readonly qualificationScore?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CustomerExportRequest {
  readonly filters?: CustomerQueryFilters;
}

export interface LeadExportRequest {
  readonly filters?: LeadQueryFilters;
}

interface SeenImportKeys {
  readonly ids: Set<string>;
  readonly emails: Set<string>;
  readonly phones: Set<string>;
}

export class CRMImportService {
  constructor(
    private readonly customerApplicationService: CustomerApplicationService,
    private readonly leadApplicationService: LeadApplicationService
  ) {}

  async importCustomers(
    request: ImportRequest<CustomerImportRecord>
  ): Promise<ImportResult> {
    const accumulator = createAccumulator(request.records.length);
    const seen = createSeenKeys();

    for (const [recordIndex, record] of request.records.entries()) {
      const errors = validateCustomerRecord(record, request.context, seen, recordIndex);

      if (errors.length > 0) {
        recordFailed(accumulator, recordIndex, errors);
        continue;
      }

      if (await this.customerExists(record, request.context)) {
        recordSkipped(accumulator, recordIndex, record.customerId, "Existing customer");
        continue;
      }

      const result = await this.customerApplicationService.createCustomer({
        commandType: "CreateCustomer",
        context: request.context,
        customerId: record.customerId,
        displayName: record.displayName ?? "",
        email: record.email,
        phone: record.phone,
        type: record.type,
        communicationPreference: record.communicationPreference,
        tags: record.tags,
      });

      if (!result.ok) {
        recordFailed(accumulator, recordIndex, [
          {
            recordIndex,
            field: "record",
            code: "ApplicationError",
            message: result.error.message,
          },
        ]);
        continue;
      }

      recordImported(accumulator, recordIndex, result.value.customer.customerId);
    }

    return finalizeImportResult(accumulator);
  }

  async importLeads(
    request: ImportRequest<LeadImportRecord>
  ): Promise<ImportResult> {
    const accumulator = createAccumulator(request.records.length);
    const seen = createSeenKeys();

    for (const [recordIndex, record] of request.records.entries()) {
      const errors = validateLeadRecord(record, request.context, seen, recordIndex);

      if (errors.length > 0) {
        recordFailed(accumulator, recordIndex, errors);
        continue;
      }

      if (await this.leadExists(record, request.context)) {
        recordSkipped(accumulator, recordIndex, record.leadId, "Existing lead");
        continue;
      }

      const result = await this.leadApplicationService.createLead({
        commandType: "CreateLead",
        context: request.context,
        leadId: record.leadId,
        displayName: record.displayName ?? "",
        email: record.email,
        phone: record.phone,
        source: record.source ?? "",
      });

      if (!result.ok) {
        recordFailed(accumulator, recordIndex, [
          {
            recordIndex,
            field: "record",
            code: "ApplicationError",
            message: result.error.message,
          },
        ]);
        continue;
      }

      recordImported(accumulator, recordIndex, result.value.lead.leadId);
    }

    return finalizeImportResult(accumulator);
  }

  private async customerExists(
    record: CustomerImportRecord,
    context: ApplicationContext
  ): Promise<boolean> {
    if (record.customerId) {
      const result = await this.customerApplicationService.getCustomer({
        queryType: "GetCustomer",
        context,
        customerId: record.customerId,
      });

      if (result.customer) {
        return true;
      }
    }

    if (record.email) {
      const result = await this.customerApplicationService.findCustomerByEmail({
        queryType: "FindCustomerByEmail",
        context,
        email: record.email,
      });

      if (result.customer) {
        return true;
      }
    }

    if (record.phone) {
      const result = await this.customerApplicationService.findCustomerByPhone({
        queryType: "FindCustomerByPhone",
        context,
        phone: record.phone,
      });

      if (result.customer) {
        return true;
      }
    }

    return false;
  }

  private async leadExists(
    record: LeadImportRecord,
    context: ApplicationContext
  ): Promise<boolean> {
    if (record.leadId) {
      const result = await this.leadApplicationService.getLead({
        queryType: "GetLead",
        context,
        leadId: record.leadId,
      });

      if (result.lead) {
        return true;
      }
    }

    if (record.email) {
      const result = await this.leadApplicationService.findLeadByEmail({
        queryType: "FindLeadByEmail",
        context,
        email: record.email,
      });

      if (result.lead) {
        return true;
      }
    }

    if (record.phone) {
      const result = await this.leadApplicationService.findLeadByPhone({
        queryType: "FindLeadByPhone",
        context,
        phone: record.phone,
      });

      if (result.lead) {
        return true;
      }
    }

    return false;
  }
}

export class CRMExportService {
  constructor(private readonly queryService: CRMQueryService) {}

  async exportCustomers(
    request: CustomerExportRequest = {}
  ): Promise<readonly CustomerExport[]> {
    return Object.freeze(
      (await this.queryService.searchCustomers(request.filters ?? {})).map(
        (customer) =>
          Object.freeze({
            customerId: customer.customerId,
            businessId: customer.businessId,
            displayName: customer.displayName,
            email: customer.email,
            phone: customer.phone,
            status: customer.status,
            type: customer.type,
            communicationPreference: customer.communicationPreference,
            tags: Object.freeze([...customer.tags]),
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
          })
      )
    );
  }

  async exportLeads(
    request: LeadExportRequest = {}
  ): Promise<readonly LeadExport[]> {
    return Object.freeze(
      (await this.queryService.searchLeads(request.filters ?? {})).map((lead) =>
        Object.freeze({
          leadId: lead.leadId,
          businessId: lead.businessId,
          displayName: lead.displayName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          qualificationScore: lead.qualificationScore,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        })
      )
    );
  }
}

interface ImportAccumulator {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  validationErrors: ImportValidationError[];
  records: ImportRecordResult[];
}

function createAccumulator(total: number): ImportAccumulator {
  return {
    total,
    imported: 0,
    skipped: 0,
    failed: 0,
    validationErrors: [],
    records: [],
  };
}

function createSeenKeys(): SeenImportKeys {
  return {
    ids: new Set<string>(),
    emails: new Set<string>(),
    phones: new Set<string>(),
  };
}

function validateCustomerRecord(
  record: CustomerImportRecord,
  context: ApplicationContext,
  seen: SeenImportKeys,
  recordIndex: number
): readonly ImportValidationError[] {
  const errors = validateSharedRecord(
    record,
    record.customerId,
    context,
    seen,
    recordIndex
  );

  if (!hasText(record.displayName)) {
    errors.push(requiredError(recordIndex, "displayName"));
  }

  return errors;
}

function validateLeadRecord(
  record: LeadImportRecord,
  context: ApplicationContext,
  seen: SeenImportKeys,
  recordIndex: number
): readonly ImportValidationError[] {
  const errors = validateSharedRecord(
    record,
    record.leadId,
    context,
    seen,
    recordIndex
  );

  if (!hasText(record.displayName)) {
    errors.push(requiredError(recordIndex, "displayName"));
  }

  if (!hasText(record.source)) {
    errors.push(requiredError(recordIndex, "source"));
  }

  return errors;
}

function validateSharedRecord(
  record: CustomerImportRecord | LeadImportRecord,
  aggregateId: CustomerId | LeadId | undefined,
  context: ApplicationContext,
  seen: SeenImportKeys,
  recordIndex: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  const email = normalizeOptionalEmail(record.email);
  const phone = normalizeOptionalPhone(record.phone);

  if (record.businessId && record.businessId !== context.businessId) {
    errors.push({
      recordIndex,
      field: "businessId",
      code: "BusinessMismatch",
      message: "Record businessId does not match import context.",
    });
  }

  if (!hasText(record.email) && !hasText(record.phone)) {
    errors.push({
      recordIndex,
      field: "contact",
      code: "Required",
      message: "At least one contact method is required.",
    });
  }

  if (hasText(record.email) && !isValidEmail(record.email ?? "")) {
    errors.push({
      recordIndex,
      field: "email",
      code: "InvalidEmail",
      message: "Email must be valid.",
    });
  }

  if (hasText(record.phone) && !isValidPhone(record.phone ?? "")) {
    errors.push({
      recordIndex,
      field: "phone",
      code: "InvalidPhone",
      message: "Phone must be valid.",
    });
  }

  if (aggregateId && seen.ids.has(aggregateId)) {
    errors.push({
      recordIndex,
      field: "id",
      code: "DuplicateIdentifier",
      message: "Identifier appears more than once in the import batch.",
    });
  }

  if (email && seen.emails.has(email)) {
    errors.push({
      recordIndex,
      field: "email",
      code: "DuplicateEmail",
      message: "Email appears more than once in the import batch.",
    });
  }

  if (phone && seen.phones.has(phone)) {
    errors.push({
      recordIndex,
      field: "phone",
      code: "DuplicatePhone",
      message: "Phone appears more than once in the import batch.",
    });
  }

  if (aggregateId) {
    seen.ids.add(aggregateId);
  }

  if (email) {
    seen.emails.add(email);
  }

  if (phone) {
    seen.phones.add(phone);
  }

  return errors;
}

function recordImported(
  accumulator: ImportAccumulator,
  recordIndex: number,
  aggregateId: CustomerId | LeadId
): void {
  accumulator.imported += 1;
  accumulator.records.push(
    Object.freeze({
      recordIndex,
      status: "imported" as const,
      aggregateId,
    })
  );
}

function recordSkipped(
  accumulator: ImportAccumulator,
  recordIndex: number,
  aggregateId: CustomerId | LeadId | undefined,
  reason: string
): void {
  accumulator.skipped += 1;
  accumulator.records.push(
    Object.freeze({
      recordIndex,
      status: "skipped" as const,
      aggregateId,
      reason,
    })
  );
}

function recordFailed(
  accumulator: ImportAccumulator,
  recordIndex: number,
  errors: readonly ImportValidationError[]
): void {
  accumulator.failed += 1;
  accumulator.validationErrors.push(...errors);
  accumulator.records.push(
    Object.freeze({
      recordIndex,
      status: "failed" as const,
      reason: errors.map((error) => error.code).join(", "),
    })
  );
}

function finalizeImportResult(accumulator: ImportAccumulator): ImportResult {
  return Object.freeze({
    total: accumulator.total,
    imported: accumulator.imported,
    skipped: accumulator.skipped,
    failed: accumulator.failed,
    validationErrors: Object.freeze([...accumulator.validationErrors]),
    records: Object.freeze([...accumulator.records]),
  });
}

function requiredError(
  recordIndex: number,
  field: string
): ImportValidationError {
  return {
    recordIndex,
    field,
    code: "Required",
    message: `${field} is required.`,
  };
}

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function normalizeOptionalEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : undefined;
}

function normalizeOptionalPhone(phone: string | undefined): string | undefined {
  const normalized = phone?.trim();
  return normalized ? normalized : undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  return /^[+\d][\d\s().-]{2,}$/.test(phone.trim());
}
