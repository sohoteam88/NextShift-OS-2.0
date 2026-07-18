import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const GOVERNANCE_DIR = 'docs/nextshift-os-3/os-3-8/3.8-C';
const PAGE_INVENTORY = `${GOVERNANCE_DIR}/U3A_PAGE_INVENTORY.json`;
const API_INVENTORY = `${GOVERNANCE_DIR}/U3A_API_METHOD_INVENTORY.json`;
const REDIRECT_INVENTORY = `${GOVERNANCE_DIR}/U3A_REDIRECT_CONSUMER_INVENTORY.json`;
const SECURITY_INVENTORY = `${GOVERNANCE_DIR}/U3A_SECURITY_AUTHORITY_INVENTORY.json`;
export const COMPLETION_MATRIX = `${GOVERNANCE_DIR}/U3B_COMPLETION_MATRIX.json`;

type Status = 'complete' | 'incomplete' | 'intentionally_retained_compatibility_source' | 'blocked';
type JsonRecord = Record<string, any>;

const SUPERADMIN_FIXTURE_FILE = 'src/__tests__/integration/u3b-postgres.test.ts';
const SUPERADMIN_ROLE_FIXTURE_FILE = 'src/__tests__/security/superadmin-mutation-authority.test.ts';
const SUPERADMIN_SHARED_POSTGRES_FIXTURES = [
  'U3B-PG-ATOMIC-TARGET-WRITES',
  'U3B-PG-FAILURE-AFTER-ROLLBACK',
  'U3B-PG-IDEMPOTENCY-DIRECT-RACE',
  'U3B-PG-IDEMPOTENCY-REPLAY-RACES',
  'U3B-PG-CORRELATION-ORDERING',
  'U3B-PG-DIGEST-CONFLICT',
  'U3B-PG-ALERT-DELIVERY-RECEIPT',
  'U3B-PG-DELETED-TERMINAL',
] as const;
const SUPERADMIN_WRITE_AUTHORITIES: Record<string, string[]> = {
  'TARGET-SUPER-001': ['writePlatformAuditInTransaction', '$transaction'],
  'TARGET-SUPER-002': ['setPlatformOverrideWithAudit'],
  'TARGET-SUPER-003': ['revokePlatformOverrideWithAudit'],
  'TARGET-SUPER-004': ['updatePlatformUserWithAudit'],
  'TARGET-SUPER-005': ['deletePlatformUserWithAudit'],
  'TARGET-SUPER-006': ['createPlatformTenantWithAudit'],
  'TARGET-SUPER-007': ['updatePlatformTenantWithAudit'],
  'TARGET-SUPER-008': ['deleteTenantWithAudit'],
  'TARGET-SUPER-009': ['writePlatformAudit'],
  'TARGET-SUPER-010': ['writePlatformAuditInTransaction', '$transaction'],
};

const PRIVILEGED_LOADERS = [
  ['operating dashboard', 'src/modules/admin/services/platformOperatingService.ts'],
  ['platform stats', 'src/modules/admin/services/platform-stats.ts'],
  ['AI tenant costs', 'src/modules/admin/services/ai-analytics.ts'],
  ['AI model costs', 'src/modules/admin/services/ai-analytics.ts'],
  ['platform users', 'src/modules/admin/services/platform-health.ts'],
  ['platform audit log', 'src/modules/admin/services/platform-health.ts'],
  ['platform health counts', 'src/modules/admin/services/platform-health.ts'],
  ['tenant list', 'src/modules/admin/services/tenant-management.ts'],
  ['tenant detail', 'src/modules/admin/services/tenant-management.ts'],
  ['founder command overview', 'src/modules/admin/services/adminCommandService.ts'],
  ['founder feature access', 'src/modules/admin/services/adminCommandService.ts'],
  ['cross-tenant API users', 'src/modules/admin/services/user-management.ts'],
  ['manual override detail', 'src/modules/saas/saasService.ts'],
  ['override expiry warnings', 'src/modules/saas/saasService.ts'],
] as const;

export class U3BValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'U3BValidationError';
  }
}

function readJson(root: string, path: string): JsonRecord {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as JsonRecord;
}

function routePath(route: string): string {
  return route.split('?')[0].replace(/:([A-Za-z0-9_]+)/g, '[$1]');
}

function apiFile(route: string): string {
  return `src/app${routePath(route)}/route.ts`;
}

function pageFile(route: string): string {
  return `src/app/(auth)${routePath(route)}/page.tsx`;
}

function source(root: string, file: string): string {
  return existsSync(resolve(root, file)) ? readFileSync(resolve(root, file), 'utf8') : '';
}

function methodIsExported(text: string, method: string): boolean {
  const patterns = [
    new RegExp(`export\\s+const\\s+${method}\\b`),
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`),
    new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function currentSource(root: string, file: string): string {
  const text = source(root, file);
  const alias = text.match(/from\s+['"]@\/(app\/api\/[^'"]+)['"]/);
  if (!alias) return text;
  const target = `src/${alias[1].replace(/\/$/, '')}.ts`;
  return `${text}\n${source(root, target)}`;
}

function isCompatibilityDisposition(disposition: string): boolean {
  return /LEGACY|MIGRATE|REPLACE_CHAIN/.test(disposition);
}

function runtimeConsumer(kind: string): boolean {
  return ![
    'ARCHIVE_REFERENCE',
    'DOCUMENTATION_REFERENCE',
    'TRACKED_GOVERNANCE_OR_CONFIG_REFERENCE',
    'TOOLING_REFERENCE',
    'TEST_REFERENCE',
    'HISTORICAL_UNMOUNTED',
    'ROUTE_OR_BOOKMARK_CONFIG',
  ].includes(kind);
}

function containsRouteLiteral(text: string, literal: string): boolean {
  const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![A-Za-z0-9])${escaped}`).test(text);
}

function statusCounts(items: Array<{ status: Status }>): Record<Status, number> {
  return items.reduce((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { complete: 0, incomplete: 0, intentionally_retained_compatibility_source: 0, blocked: 0 } as Record<Status, number>);
}

export function buildCompletionMatrix(root: string): JsonRecord {
  const pages = readJson(root, PAGE_INVENTORY);
  const apis = readJson(root, API_INVENTORY);
  const redirects = readJson(root, REDIRECT_INVENTORY);
  const security = readJson(root, SECURITY_INVENTORY);
  const redirectPolicy = source(root, 'src/lib/navigation/compatibility-policy.ts');
  const writesByMethod = new Map<string, JsonRecord[]>();
  for (const target of apis.target_write_capabilities as JsonRecord[]) {
    const rows = writesByMethod.get(target.source_method_id) ?? [];
    rows.push({
      route: target.target_route,
      method: target.target_method,
      namespace: target.target_namespace,
      roles: target.target_roles,
      tenant_authority: target.tenant_authority,
    });
    writesByMethod.set(target.source_method_id, rows);
  }

  const pageRows = pages.entries.map((entry: JsonRecord) => {
    const targets = entry.targets.map((target: JsonRecord) => ({
      route: target.route,
      file: pageFile(target.route),
      exists: existsSync(resolve(root, pageFile(target.route))),
      roles: target.roles,
      tenant_authority: target.tenant_authority,
    }));
    const compatibility = isCompatibilityDisposition(entry.disposition);
    const sourceExists = existsSync(resolve(root, entry.source_file));
    const policyPresent = !compatibility ||
      redirectPolicy.includes(`'${entry.source_route}'`) ||
      (entry.source_route === '/workspace/[...path]' && redirectPolicy.includes("pathname.startsWith('/workspace/')"));
    const ready = sourceExists && targets.every((target: JsonRecord) => target.exists) && policyPresent;
    return {
      stable_id: entry.stable_id,
      source_route: entry.source_route,
      source_file: entry.source_file,
      disposition: entry.disposition,
      status: ready ? (compatibility ? 'intentionally_retained_compatibility_source' : 'complete') : 'incomplete',
      canonical_targets: targets,
      role_boundary: targets.map((target: JsonRecord) => target.roles),
      tenant_boundary: targets.map((target: JsonRecord) => target.tenant_authority),
      redirect_disposition: compatibility ? 'authorization_first_terminal_301' : 'terminal_canonical_page',
      test_evidence: entry.required_test_ids,
    };
  });

  const methodRows = apis.sources.flatMap((api: JsonRecord) => api.methods.map((method: JsonRecord) => {
    const declaredTargets = method.targets.length > 0 ? method.targets : (writesByMethod.get(method.stable_capability_id) ?? []);
    const targets = declaredTargets.map((target: JsonRecord) => {
      const file = apiFile(target.route);
      const text = currentSource(root, file);
      return { route: target.route, method: target.method, file, exists: Boolean(text), method_exported: methodIsExported(text, target.method), namespace: target.namespace, roles: target.roles, tenant_authority: target.tenant_authority };
    });
    const sourceExists = existsSync(resolve(root, api.source_file));
    const ready = sourceExists && targets.length > 0 && targets.every((target: JsonRecord) => target.exists && target.method_exported);
    return {
      stable_capability_id: method.stable_capability_id,
      source_file_id: api.stable_file_id,
      source_route: api.source_route,
      source_file: api.source_file,
      source_method: method.source_method,
      classification: method.classification,
      status: ready ? 'complete' : 'incomplete',
      canonical_targets: targets,
      caller_migration: ready ? 'canonical target exported; runtime caller census validated separately' : 'missing canonical target',
      mutation_disposition: method.is_privileged_source_write ? 'authorization_first_410_or_canonical_only' : 'read compatibility per frozen target',
      test_evidence: method.required_test_ids,
    };
  }));

  const targetRows = apis.target_write_capabilities.map((target: JsonRecord) => {
    const file = apiFile(target.target_route);
    const text = currentSource(root, file);
    const auditRequired = target.target_namespace === 'superadmin';
    const fixtureSource = source(root, SUPERADMIN_FIXTURE_FILE);
    const roleFixtureSource = source(root, SUPERADMIN_ROLE_FIXTURE_FILE);
    const roleFixturePresent = !auditRequired || (
      roleFixtureSource.includes(target.stable_target_id) &&
      roleFixtureSource.includes('U3B-SUPERADMIN-WRITE-ROLE-GUARD')
    );
    const postgresFixturesPresent = !auditRequired || (
      fixtureSource.includes(target.stable_target_id) &&
      SUPERADMIN_SHARED_POSTGRES_FIXTURES.every((fixture) => fixtureSource.includes(fixture))
    );
    const namedFixturePresent = roleFixturePresent && postgresFixturesPresent;
    const requiredAuthorities = SUPERADMIN_WRITE_AUTHORITIES[target.stable_target_id] ?? [];
    const transactionAuthorityPresent = !auditRequired || requiredAuthorities.every((authority) => text.includes(authority));
    const auditPresent = !auditRequired || (namedFixturePresent && transactionAuthorityPresent);
    const roleBoundaryPresent = target.target_namespace === 'superadmin'
      ? /requireRoleApi\([\s\S]{0,120}\['platform_admin'\]\)/.test(text)
      : target.target_roles.includes('leader')
        ? /requireRoleApi\([\s\S]{0,120}\['leader', 'operator'\]\)/.test(text)
        : /requireRoleApi\([\s\S]{0,120}\['operator'\]\)/.test(text);
    const ready = Boolean(text) && methodIsExported(text, target.target_method) && auditPresent && roleBoundaryPresent;
    return {
      stable_target_id: target.stable_target_id,
      source_method_id: target.source_method_id,
      target_route: target.target_route,
      target_method: target.target_method,
      target_namespace: target.target_namespace,
      target_file: file,
      status: ready ? 'complete' : 'incomplete',
      role_boundary: target.target_roles,
      role_boundary_present: roleBoundaryPresent,
      tenant_boundary: target.tenant_authority,
      audit_requirement: target.audit,
      success_failure_audit_present: auditPresent,
      executable_fixture: auditRequired ? {
        stable_id: `U3B-POSTGRES-${target.stable_target_id}`,
        files: [SUPERADMIN_ROLE_FIXTURE_FILE, SUPERADMIN_FIXTURE_FILE],
        named_fixture_present: namedFixturePresent,
        role_fixture: 'U3B-SUPERADMIN-WRITE-ROLE-GUARD',
        postgres_fixtures: SUPERADMIN_SHARED_POSTGRES_FIXTURES,
        transaction_authority_present: transactionAuthorityPresent,
        required_authorities: requiredAuthorities,
        verifies: ['exact_role_guard', 'platform_scope', 'success_audit', 'failure_audit', 'transaction_or_durable_ordering', 'idempotency', 'deleted_terminal_policy'],
      } : null,
      test_evidence: target.required_test_ids,
    };
  });

  const loaderFixtureSource = source(root, 'src/__tests__/security/platform-data-authority.test.ts');
  const privilegedLoaderRows = PRIVILEGED_LOADERS.map(([name, file], index) => {
    const text = source(root, file);
    const authorityPresent = text.includes('requirePlatformAdminDataAccess');
    const fixturePresent = loaderFixtureSource.includes(`'${name}'`);
    return {
      stable_id: `PRIVILEGED-LOADER-${String(index + 1).padStart(3, '0')}`,
      name,
      source_file: file,
      status: authorityPresent && fixturePresent ? 'complete' : 'incomplete',
      exact_role_guard: 'platform_admin',
      authority_present: authorityPresent,
      executable_fixture: {
        file: 'src/__tests__/security/platform-data-authority.test.ts',
        named_fixture_present: fixturePresent,
        denied_roles: ['member', 'leader', 'operator'],
      },
    };
  });

  const compatibilityRows = redirects.redirect_entries.map((entry: JsonRecord) => ({
    stable_id: entry.stable_id,
    source_route: entry.source_route,
    targets: entry.target_routes,
    status: (
      redirectPolicy.includes(`'${entry.source_route}'`) ||
      (entry.source_route === '/workspace/[...path]' && redirectPolicy.includes("pathname.startsWith('/workspace/')"))
    ) ? 'complete' : 'incomplete',
    required_status: entry.required_status,
    terminal: entry.terminal,
    query_allowlist: entry.query_allowlist,
    role_boundary: entry.target_roles,
    mutation_disposition: entry.non_get_policy,
    test_evidence: entry.required_test_ids,
  }));

  const consumerRows = redirects.consumer_snapshot.map((entry: JsonRecord, index: number) => {
    const text = source(root, entry.path);
    const remains = containsRouteLiteral(text, entry.literal);
    const retained = !runtimeConsumer(entry.kind) || /page\.tsx$/.test(entry.path) || entry.path === 'src/lib/navigation/compatibility-policy.ts';
    return {
      stable_id: `CONSUMER-${String(index + 1).padStart(3, '0')}`,
      ...entry,
      status: remains ? (retained ? 'intentionally_retained_compatibility_source' : 'incomplete') : 'complete',
      caller_migration: remains ? (retained ? 'non-runtime or compatibility authority retained' : 'runtime legacy literal remains') : 'legacy literal removed or canonicalized',
    };
  });

  const securityRows = security.authority_entries.map((entry: JsonRecord) => {
    const paths = entry.source_paths.map((path: string) => ({ path, exists: existsSync(resolve(root, path)) }));
    return {
      stable_id: entry.stable_id,
      authority_class: entry.authority_class,
      status: paths.every((item: JsonRecord) => item.exists) ? 'complete' : 'incomplete',
      source_paths: paths,
      required_enforcement: entry.required_enforcement,
      test_evidence: entry.required_test_ids,
    };
  });

  const allRows = [...pageRows, ...methodRows, ...targetRows, ...compatibilityRows, ...consumerRows, ...securityRows, ...privilegedLoaderRows];
  return {
    schema_version: 1,
    task_id: 'U3B',
    frozen_authority: {
      pages: PAGE_INVENTORY,
      apis: API_INVENTORY,
      redirects_consumers: REDIRECT_INVENTORY,
      security: SECURITY_INVENTORY,
    },
    expected_counts: {
      privileged_pages: 39,
      api_source_files: 37,
      exported_methods: 57,
      source_writes: 30,
      target_writes: 33,
      admin_target_writes: 23,
      superadmin_target_writes: 10,
      superadmin_success_failure_audits: 10,
      consumer_rows: 241,
      consumer_files: 85,
      consumer_occurrences: 521,
      compatibility_page_routes: 22,
      security_authorities: security.authority_entries.length,
      privileged_cross_tenant_loaders: PRIVILEGED_LOADERS.length,
    },
    page_rows: pageRows,
    api_method_rows: methodRows,
    target_write_rows: targetRows,
    compatibility_route_rows: compatibilityRows,
    consumer_rows: consumerRows,
    security_authority_rows: securityRows,
    privileged_loader_rows: privilegedLoaderRows,
    status_counts: statusCounts(allRows),
  };
}

function exactCount(label: string, actual: number, expected: number, passes: string[]): void {
  if (actual !== expected) throw new U3BValidationError(`${label}: expected ${expected}, got ${actual}`);
  passes.push(`${label}=${actual}`);
}

function invariant(root: string, file: string, required: RegExp[], forbidden: RegExp[], passes: string[], label: string): void {
  const text = source(root, file);
  if (!text) throw new U3BValidationError(`${label}: missing ${file}`);
  for (const pattern of required) {
    if (!pattern.test(text)) throw new U3BValidationError(`${label}: ${file} is missing ${pattern}`);
  }
  for (const pattern of forbidden) {
    if (pattern.test(text)) throw new U3BValidationError(`${label}: ${file} contains forbidden ${pattern}`);
  }
  passes.push(label);
}

export function validateCompletionMatrix(root: string, matrix = buildCompletionMatrix(root)): { passes: string[]; assertions: number } {
  const passes: string[] = [];
  const expected = matrix.expected_counts;
  const api = readJson(root, API_INVENTORY);
  const redirect = readJson(root, REDIRECT_INVENTORY);
  exactCount('privileged_pages', matrix.page_rows.length, expected.privileged_pages, passes);
  exactCount('api_source_files', new Set(matrix.api_method_rows.map((row: JsonRecord) => row.source_file)).size, expected.api_source_files, passes);
  exactCount('exported_methods', matrix.api_method_rows.length, expected.exported_methods, passes);
  exactCount('source_writes', api.sources.flatMap((item: JsonRecord) => item.methods).filter((item: JsonRecord) => item.is_privileged_source_write).length, expected.source_writes, passes);
  exactCount('target_writes', matrix.target_write_rows.length, expected.target_writes, passes);
  exactCount('admin_target_writes', matrix.target_write_rows.filter((row: JsonRecord) => row.target_namespace === 'admin').length, expected.admin_target_writes, passes);
  exactCount('superadmin_target_writes', matrix.target_write_rows.filter((row: JsonRecord) => row.target_namespace === 'superadmin').length, expected.superadmin_target_writes, passes);
  exactCount('superadmin_success_failure_audits', matrix.target_write_rows.filter((row: JsonRecord) => row.target_namespace === 'superadmin' && row.success_failure_audit_present).length, expected.superadmin_success_failure_audits, passes);
  exactCount('consumer_rows', matrix.consumer_rows.length, expected.consumer_rows, passes);
  exactCount('consumer_files', new Set(matrix.consumer_rows.map((row: JsonRecord) => row.path)).size, expected.consumer_files, passes);
  exactCount('consumer_occurrences', redirect.consumer_snapshot.reduce((sum: number, row: JsonRecord) => sum + row.count, 0), expected.consumer_occurrences, passes);
  exactCount('compatibility_page_routes', matrix.compatibility_route_rows.length, expected.compatibility_page_routes, passes);
  exactCount('security_authorities', matrix.security_authority_rows.length, expected.security_authorities, passes);
  exactCount('privileged_cross_tenant_loaders', matrix.privileged_loader_rows.length, expected.privileged_cross_tenant_loaders, passes);
  for (const [section, rows] of Object.entries({ pages: matrix.page_rows, methods: matrix.api_method_rows, targets: matrix.target_write_rows, redirects: matrix.compatibility_route_rows, security: matrix.security_authority_rows, privileged_loaders: matrix.privileged_loader_rows })) {
    const incomplete = (rows as JsonRecord[]).filter((row) => row.status === 'incomplete' || row.status === 'blocked');
    if (incomplete.length) throw new U3BValidationError(`${section} incomplete: ${incomplete.map((row) => row.stable_id ?? row.stable_capability_id ?? row.stable_target_id).join(', ')}`);
    passes.push(`${section}_complete`);
  }
  const runtimeLegacy = matrix.consumer_rows.filter((row: JsonRecord) => row.status === 'incomplete');
  if (runtimeLegacy.length) throw new U3BValidationError(`runtime legacy callers remain: ${runtimeLegacy.map((row: JsonRecord) => `${row.path}:${row.literal}`).join(', ')}`);
  passes.push('runtime_callers_migrated');
  for (const sourceEntry of api.sources as JsonRecord[]) {
    const writeMethods = sourceEntry.methods.filter((method: JsonRecord) => method.is_privileged_source_write);
    if (writeMethods.length === 0) continue;
    const sourceRoute = sourceEntry.source_route;
    const hasCanonicalWriteAtSource = writeMethods.some((method: JsonRecord) =>
      (writesBySourceMethod(api, method.stable_capability_id) as JsonRecord[])
        .some((target) => target.target_route === sourceRoute));
    if (hasCanonicalWriteAtSource) continue;
    const text = source(root, sourceEntry.source_file);
    const authAt = text.indexOf('requireAuthApi(');
    const boundaryAt = Math.max(text.indexOf('requireCanonicalMutationPath('), text.indexOf('status: 410'));
    if (authAt < 0 || boundaryAt < 0 || authAt > boundaryAt) {
      throw new U3BValidationError(`legacy mutation is not authorization-first: ${sourceEntry.source_file}`);
    }
  }
  passes.push('legacy_mutations_authorization_first');
  invariant(root, 'src/app/(auth)/admin/layout.tsx', [/leader/, /operator/, /tenantStatus === 'deleted'/], [/platform_admin/], passes, 'admin_role_boundary');
  invariant(root, 'src/app/(auth)/superadmin/layout.tsx', [/user\.role !== 'platform_admin'/], [], passes, 'superadmin_role_boundary');
  if (existsSync(resolve(root, 'src/app/(auth)/superadmin/[...path]/page.tsx'))) throw new U3BValidationError('superadmin catch-all is forbidden');
  passes.push('no_superadmin_catchall');
  invariant(root, 'src/lib/navigation/compatibility-policy.ts', [/status: 301/, /SOURCE_BOOKMARK/, /memberQueryAuthorized/, /WORKSPACE_COMPATIBILITY_NOT_APPROVED/], [/status: 302/, /destination:\s*searchParams/], passes, 'terminal_redirect_policy');
  invariant(root, 'src/modules/admin/services/platform-audit-service.ts', [/ON CONFLICT \(["']?idempotency_key["']?\)/, /AUDIT_IDEMPOTENCY_CONFLICT/, /canonicalizeJson/], [/findFirst\s*\(/], passes, 'atomic_audit_authority');
  invariant(root, 'src/modules/admin/workers/audit-outbox-worker.ts', [/FOR UPDATE SKIP LOCKED/, /dead_letter/, /next_attempt_at/, /retention/], [], passes, 'outbox_replay_authority');
  invariant(root, 'src/modules/admin/workers/audit-outbox-worker.ts', [/NOT EXISTS[\s\S]*earlier\."correlation_id"/, /audit_operational_alerts/, /delivery_receipt/], [/"alerted_at"\s*=\s*\$\{deadLetter/], passes, 'ordered_replay_and_alert_receipt_authority');
  invariant(root, 'supabase/migrations/20260717135456_u3b_three_space_audit.sql', [/CREATE UNIQUE INDEX[\s\S]*idempotency/i, /audit_event_outbox/i, /audit_operational_alerts/i, /delivery_receipt/i, /legal_hold/i, /retention_until/i], [], passes, 'database_audit_authority');
  const productionSources = [
    'src/app/api/v1/lead-magnet/publish/route.ts',
    'src/app/api/v1/video/projects/[id]/publish/route.ts',
    'src/app/api/v1/funnel-builder/publish-landing-page/route.ts',
    'src/modules/automation/automationEngine.ts',
    'src/modules/autonomous-execution/services/autonomous-scheduler.ts',
    'src/modules/agent-workforce/services/agent-workforce-service.ts',
    'src/modules/payments/paymentService.ts',
  ];
  for (const file of productionSources) invariant(root, file, [/assertTenantOperational|tenantOperationalState/], [], passes, `deleted_tenant:${file}`);
  return { passes, assertions: passes.length };
}

function writesBySourceMethod(api: JsonRecord, sourceMethodId: string): JsonRecord[] {
  return api.target_write_capabilities.filter((target: JsonRecord) => target.source_method_id === sourceMethodId);
}

if (process.argv[1]?.endsWith('validator.ts')) {
  const root = resolve(process.cwd());
  const matrix = buildCompletionMatrix(root);
  const report = validateCompletionMatrix(root, matrix);
  if (process.argv.includes('--write')) {
    const target = resolve(root, COMPLETION_MATRIX);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(matrix, null, 2)}\n`);
  }
  process.stdout.write(`U3B completion validator PASS (${report.assertions} assertions)\n`);
}
