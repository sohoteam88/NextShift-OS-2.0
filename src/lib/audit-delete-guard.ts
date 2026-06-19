import { AppError } from '@/lib/errors';

export function assertAuditDeleteAllowed(operation: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError(
      'FORBIDDEN',
      403,
      `${operation} is disabled in production by ADR-023 audit retention enforcement`,
    );
  }
}

export function assertTenantHardDeleteAllowed(): void {
  assertAuditDeleteAllowed('tenant.delete()');
}
