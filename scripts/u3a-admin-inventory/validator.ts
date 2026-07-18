import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const;
const U3A_DIR = 'docs/nextshift-os-3/os-3-8/3.8-C';
const PAGE_MANIFEST = `${U3A_DIR}/U3A_PAGE_INVENTORY.json`;
const API_MANIFEST = `${U3A_DIR}/U3A_API_METHOD_INVENTORY.json`;
const REDIRECT_MANIFEST = `${U3A_DIR}/U3A_REDIRECT_CONSUMER_INVENTORY.json`;
const SECURITY_MANIFEST = `${U3A_DIR}/U3A_SECURITY_AUTHORITY_INVENTORY.json`;
const PIPELINE_MANIFEST = 'docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json';
const DECISION_ARTIFACT = `${U3A_DIR}/U3_AUDITLOG_ADR_DECISION.json`;
const CONTRACT = `${U3A_DIR}/U3_ADMIN_SPACE_SEPARATION_CONTRACT.md`;
const BASELINE = '76636360d8c1a643c86bb26eb8923c6271241679';
const APPROVED_COUNTS = {
  authenticatedPages: 112,
  privilegedPages: 39,
  retainedPageTerminals: 17,
  pageRedirects: 22,
  apiSourceFiles: 37,
  apiMethods: 57,
  sourceWrites: 30,
  targetWrites: 33,
  adminWrites: 23,
  superadminWrites: 10,
} as const;
const SECURITY_AUTHORITY_PATHS_SHA256 = '9f9cfdedeb8deb7431b12722069cf2e9308e06b61e295a687dcdc8daf7bba991';
const AUDIT_DATABASE_CONTRACT_SHA256 = '866a9c85c46be5ae6b17b38464e606c138d59c3bc241bb3e13989bc4900a620f';
const FROZEN_MANIFEST_SHA256: Record<string, string> = {
  page: 'b3b7b008c4117155a51ba38aeea790707cb18358ed2b973607f78f0ac958ac8e',
  api: '0863c24ddd63d4f9f4585bf1d950f506b0a2012ec8d71822f35cb461dd42eb26',
  redirect: '54ae83a5ca8758f05f8ba7f4f545fdf2bb61f3728eb1bd88e27077b08c9733f6',
  security: '9eae27a98c9665db6e9377e180753a4b84fae5a105cce7c7bf503c232ab5b803',
};

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

export class InventoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryValidationError';
  }
}

export interface InventoryBundle {
  page: JsonObject;
  api: JsonObject;
  redirect: JsonObject;
  security: JsonObject;
  pipeline: JsonObject;
  decision: JsonObject;
}

export interface ConsumerObservation {
  path: string;
  literal: string;
  count: number;
  kind: string;
  resolution_group_id: string;
}

export interface InventoryObservations {
  authenticatedPageFiles: string[];
  privilegedPageFiles: string[];
  apiMethodsByFile: Record<string, string[]>;
  privilegedApiCandidateFiles: string[];
  pageConsumersByRoute: Record<string, string[]>;
  apiConsumersByRoute: Record<string, string[]>;
  consumerSnapshot: ConsumerObservation[];
}

export interface ValidationReport {
  passes: string[];
  stats: {
    authenticatedPages: number;
    privilegedPages: number;
    apiSourceFiles: number;
    apiMethods: number;
    sourceWrites: number;
    targetWrites: number;
    adminWrites: number;
    superadminWrites: number;
    redirects: number;
    consumerRows: number;
    protectedPaths: number;
  };
}

function fail(message: string): never {
  throw new InventoryValidationError(message);
}

function check(condition: unknown, message: string, passes: string[]): asserts condition {
  if (!condition) fail(message);
  passes.push(message);
}

function asObject(value: Json | undefined, label: string): JsonObject {
  if (!value || Array.isArray(value) || typeof value !== 'object') fail(`${label} must be an object`);
  return value;
}

function asArray(value: Json | undefined, label: string): Json[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function asString(value: Json | undefined, label: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function asNumber(value: Json | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${label} must be a number`);
  return value;
}

function asBoolean(value: Json | undefined, label: string): boolean {
  if (typeof value !== 'boolean') fail(`${label} must be a boolean`);
  return value;
}

function asText(value: Json | undefined, label: string): string {
  if (typeof value !== 'string') fail(`${label} must be a string`);
  return value;
}

function asStringArray(value: Json | undefined, label: string, allowEmpty = false): string[] {
  const result = asArray(value, label).map((item, index) => asString(item, `${label}[${index}]`));
  if (!allowEmpty && result.length === 0) fail(`${label} must not be empty`);
  unique(result, label);
  return result;
}

function assertSafeRepoPath(value: Json | undefined, label: string): string {
  const path = asString(value, label);
  if (path.startsWith('/') || path.includes('\\') || /[\u0000-\u001f\u007f]/.test(path) || path.split('/').includes('..')) {
    fail(`${label} must be a safe repository-relative path`);
  }
  return path;
}

function assertSafeExistingRepoPath(root: string, value: Json | undefined, label: string): string {
  const path = assertSafeRepoPath(value, label);
  if (!existsSync(resolve(root, path))) fail(`${label} does not exist: ${path}`);
  return path;
}

function readJson(root: string, path: string): JsonObject {
  return asObject(JSON.parse(readFileSync(resolve(root, path), 'utf8')) as Json, path);
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalize(value: Json): Json {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJsonSha256(value: Json): string {
  return sha256(`${JSON.stringify(canonicalize(value))}\n`);
}

function listFiles(root: string, directory: string, predicate: (path: string) => boolean): string[] {
  const absolute = resolve(root, directory);
  if (!existsSync(absolute)) return [];
  const result: string[] = [];
  const visit = (current: string) => {
    for (const name of readdirSync(current).sort()) {
      const child = resolve(current, name);
      const stat = lstatSync(child);
      if (stat.isSymbolicLink()) fail(`symlink is not allowed in inventory discovery: ${relative(root, child)}`);
      if (stat.isDirectory()) visit(child);
      else {
        const normalized = relative(root, child).split(sep).join('/');
        if (predicate(normalized)) result.push(normalized);
      }
    }
  };
  visit(absolute);
  return result.sort();
}

function routeFromPageFile(file: string): string {
  const prefix = 'src/app/(auth)';
  if (!file.startsWith(prefix) || !file.endsWith('/page.tsx')) fail(`invalid auth page file: ${file}`);
  const route = file.slice(prefix.length, -'/page.tsx'.length);
  return route || '/';
}

function routeFromApiFile(file: string): string {
  const prefix = 'src/app';
  if (!file.startsWith(prefix) || !file.endsWith('/route.ts')) fail(`invalid API route file: ${file}`);
  return file.slice(prefix.length, -'/route.ts'.length).replaceAll('[id]', ':id');
}

function extractHttpMethods(source: string): string[] {
  const methods = new Set<string>();
  const patterns = [
    /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g,
    /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) methods.add(match[1]);
  }
  return [...methods].sort((a, b) => HTTP_METHODS.indexOf(a as typeof HTTP_METHODS[number]) - HTTP_METHODS.indexOf(b as typeof HTTP_METHODS[number]));
}

function unique(values: string[], label: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) fail(`${label} has duplicate values: ${[...new Set(duplicates)].join(', ')}`);
}

export function assertExactStringSet(label: string, expected: string[], actual: string[]): void {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = [...expectedSet].filter((value) => !actualSet.has(value)).sort();
  const extra = [...actualSet].filter((value) => !expectedSet.has(value)).sort();
  if (missing.length > 0 || extra.length > 0) {
    fail(`${label} mismatch; missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
  }
}

function classifyConsumer(path: string, literal: string): Pick<ConsumerObservation, 'kind' | 'resolution_group_id'> {
  const isTest = path.startsWith('tests/') || path.includes('.test.') || path.includes('.spec.');
  let kind: string;
  if (path === 'src/components/layouts/Sidebar.tsx') kind = 'HISTORICAL_UNMOUNTED';
  else if (path.startsWith('archive/')) kind = 'ARCHIVE_REFERENCE';
  else if (path.startsWith('docs/')) kind = 'DOCUMENTATION_REFERENCE';
  else if (path.startsWith('scripts/')) kind = 'TOOLING_REFERENCE';
  else if (isTest) kind = 'TEST_REFERENCE';
  else if (path.startsWith('src/components/layouts/')) kind = 'MOUNTED_NAVIGATION_OR_SHELL';
  else if (path.includes('/app/(auth)/')) kind = 'PAGE_OR_REDIRECT_AUTHORITY';
  else if (path.includes('canonical-routes') || path.includes('workspace-config') || path.includes('/constants/')) kind = 'ROUTE_OR_BOOKMARK_CONFIG';
  else if (path.startsWith('src/app/api/')) kind = 'API_RUNTIME_CONSUMER';
  else if (!path.startsWith('src/')) kind = 'TRACKED_GOVERNANCE_OR_CONFIG_REFERENCE';
  else kind = 'PRODUCT_CTA_OR_RUNTIME_CONSUMER';

  let resolution_group_id: string;
  if (kind === 'ARCHIVE_REFERENCE') resolution_group_id = 'CONSUMER-ARCHIVE';
  else if (kind === 'DOCUMENTATION_REFERENCE' || kind === 'TRACKED_GOVERNANCE_OR_CONFIG_REFERENCE') resolution_group_id = 'CONSUMER-DOCS';
  else if (kind === 'TOOLING_REFERENCE') resolution_group_id = 'CONSUMER-TOOLING';
  else if (kind === 'TEST_REFERENCE') resolution_group_id = 'CONSUMER-TESTS';
  else if (kind === 'HISTORICAL_UNMOUNTED') resolution_group_id = 'CONSUMER-HISTORICAL-SIDEBAR';
  else if (literal.startsWith('/platform-admin')) resolution_group_id = 'CONSUMER-PLATFORM-LEGACY';
  else if (literal.startsWith('/admin-command')) resolution_group_id = 'CONSUMER-ADMIN-COMMAND';
  else if (literal.startsWith('/team/growth')) {
    resolution_group_id = path === 'src/app/(auth)/team/growth/page.tsx'
      ? 'CONSUMER-TEAM-GROWTH-COMPAT'
      : 'CONSUMER-TEAM-MEMBER-PRODUCT';
  } else if (literal.startsWith('/team/members')) {
    resolution_group_id = path.includes('src/app/(auth)/team/members')
      ? 'CONSUMER-TEAM-MEMBERS-COMPAT'
      : 'CONSUMER-TEAM-MIXED';
  } else if (literal === '/team' || literal.startsWith('/team?')) {
    resolution_group_id = path.includes('src/app/(auth)/team')
      ? 'CONSUMER-TEAM-COMPAT'
      : 'CONSUMER-TEAM-MIXED';
  } else if (literal.startsWith('/workspace')) {
    resolution_group_id = path === 'src/modules/workspace/workspace-config.ts'
      ? 'CONSUMER-WORKSPACE-MEMBER-CONFIG'
      : 'CONSUMER-WORKSPACE-COMPAT';
  } else {
    resolution_group_id = 'CONSUMER-REVIEW-REQUIRED';
  }
  return { kind, resolution_group_id };
}

function trackedTextFiles(root: string): string[] {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  }).split('\0').filter(Boolean).filter((path) => {
    if (path.startsWith(`${U3A_DIR}/U3A_`) || path.startsWith('scripts/u3a-admin-inventory/')) return false;
    return !/\.(?:avif|gif|ico|jpe?g|pdf|png|svg|webp|woff2?|zip)$/i.test(path);
  }).sort();
}

function readTrackedText(root: string, path: string): string | undefined {
  const absolute = resolve(root, path);
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink()) fail(`tracked symlink is not allowed in inventory discovery: ${path}`);
  const bytes = readFileSync(absolute);
  if (bytes.includes(0)) return undefined;
  return bytes.toString('utf8');
}

function routePattern(route: string): RegExp {
  const escaped = route.split('/').map((segment) => {
    if (segment === ':id') return '[^/]+';
    if (segment === '[...path]') return '.+';
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return new RegExp(`^${escaped}$`);
}

export function normalizeRuntimeRouteLiteral(literal: string): string {
  const withoutQuery = literal.split('?')[0].split('#')[0];
  return withoutQuery.replace(/\/\$\{[^}/]+\}(?=\/|$)/g, '/:id');
}

function scanRuntimeRouteConsumers(root: string, routes: string[]): Record<string, string[]> {
  const result = Object.fromEntries(routes.map((route) => [route, [] as string[]]));
  const patterns = Object.fromEntries(routes.map((route) => [route, routePattern(route)]));
  const literalPattern = /(["'`])(\/[^"'`\s<)]*)\1/g;
  const files = trackedTextFiles(root).filter((path) => path.startsWith('src/') || path.startsWith('tests/'));
  for (const path of files) {
    const source = readTrackedText(root, path);
    if (source === undefined) continue;
    const literals = [...source.matchAll(literalPattern)].map((match) => {
      let literal = normalizeRuntimeRouteLiteral(match[2]);
      const trailingExpression = literal.match(/^(.*)(\$\{[^}]+\})$/);
      if (trailingExpression && !trailingExpression[1].endsWith('/')) literal = trailingExpression[1];
      return literal;
    });
    for (const route of routes) {
      if (literals.some((literal) => patterns[route].test(literal))) result[route].push(path);
    }
  }
  for (const route of routes) result[route] = [...new Set(result[route])].sort();
  return result;
}

function normalizeConsumerRoute(candidate: string): string | undefined {
  let literal = candidate.replace(/[,;:!?]+$/g, '');
  if (literal.endsWith(']') && !literal.includes('[')) literal = literal.slice(0, -1);
  if (literal.endsWith('.') && !literal.endsWith('...]')) literal = literal.replace(/\.+$/g, '');
  if (/(?:^|\/)[^/?#]+\.(?:[cm]?[jt]sx?|md|json|sh)(?:[?#]|$)/i.test(literal)) {
    return undefined;
  }
  const prefixes = ['/platform-admin', '/admin-command', '/team', '/workspace'];
  return prefixes.some((prefix) =>
    literal === prefix ||
    literal.startsWith(`${prefix}/`) ||
    literal.startsWith(`${prefix}?`) ||
    literal.startsWith(`${prefix}#`)
  ) ? literal : undefined;
}

/**
 * Extract legacy privileged-route references from source text. The boundary rule
 * deliberately accepts prose (`GET /team`), Markdown (`](/team)`), quoted code,
 * and absolute URLs while rejecting repository/API fragments such as
 * `src/modules/team` and `/api/v1/team`.
 */
export function extractConsumerRouteLiterals(source: string): string[] {
  const literals: string[] = [];
  const relative = /(^|[^A-Za-z0-9_./)\]-])(\/[^\s"'`<>()>,;]+)/gm;
  for (const match of source.matchAll(relative)) {
    const literal = normalizeConsumerRoute(match[2]);
    if (literal) literals.push(literal);
  }

  const absolute = /https?:\/\/[^/\s"'`<>()]+(\/[^\s"'`<>()>,;]*)/g;
  for (const match of source.matchAll(absolute)) {
    const literal = normalizeConsumerRoute(match[1]);
    if (literal) literals.push(literal);
  }
  return literals;
}

function scanConsumerSnapshot(root: string): ConsumerObservation[] {
  const files = trackedTextFiles(root);
  const rows: ConsumerObservation[] = [];
  for (const path of files) {
    let source: string;
    try {
      const tracked = readTrackedText(root, path);
      if (tracked === undefined) continue;
      source = tracked;
    } catch {
      continue;
    }
    const counts = new Map<string, number>();
    for (const literal of extractConsumerRouteLiterals(source)) {
      counts.set(literal, (counts.get(literal) ?? 0) + 1);
    }
    for (const [literal, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      rows.push({ path, literal, count, ...classifyConsumer(path, literal) });
    }
  }
  return rows.sort((a, b) => `${a.path}\0${a.literal}`.localeCompare(`${b.path}\0${b.literal}`));
}

function consumerKey(row: ConsumerObservation): string {
  return `${row.path}\0${row.literal}\0${row.count}\0${row.kind}\0${row.resolution_group_id}`;
}

function gitBlobAt(root: string, ref: string, path: string): string {
  return execFileSync('git', ['rev-parse', `${ref}:${path}`], { cwd: root, encoding: 'utf8' }).trim();
}

function gitBlob(root: string, path: string): string {
  return gitBlobAt(root, 'HEAD', path);
}

export function loadInventoryBundle(root: string): InventoryBundle {
  return {
    page: readJson(root, PAGE_MANIFEST),
    api: readJson(root, API_MANIFEST),
    redirect: readJson(root, REDIRECT_MANIFEST),
    security: readJson(root, SECURITY_MANIFEST),
    pipeline: readJson(root, PIPELINE_MANIFEST),
    decision: readJson(root, DECISION_ARTIFACT),
  };
}

export function buildInventoryObservations(root: string, bundle = loadInventoryBundle(root)): InventoryObservations {
  const authenticatedPageFiles = listFiles(root, 'src/app/(auth)', (path) => path.endsWith('/page.tsx'));
  const pageEntries = asArray(bundle.page.entries, 'page.entries').map((entry, index) => asObject(entry, `page.entries[${index}]`));
  const pageEntryFiles = pageEntries.map((entry, index) => asString(entry.source_file, `page.entries[${index}].source_file`));
  const exclusions = new Set(
    asArray(asObject(bundle.page.discovery, 'page.discovery').classified_non_sources, 'page.discovery.classified_non_sources')
      .map((entry, index) => asString(asObject(entry, `page exclusion ${index}`).source_file, `page exclusion ${index}.source_file`)),
  );
  const outsideSources = new Set(
    asArray(asObject(bundle.page.discovery, 'page.discovery').outside_prefix_sources, 'page.discovery.outside_prefix_sources')
      .map((value, index) => asString(value, `outside source ${index}`)),
  );
  const privilegedPageCandidates = new Set<string>();
  const privilegeSignal = /user\.role\s*(?:===|!==)\s*['"]platform_admin['"]|\[['"]operator['"],\s*['"]platform_admin['"]\]|\[['"]leader['"],\s*['"]operator['"],\s*['"]platform_admin['"]\]|user\.role\s*===\s*['"]member['"]/;
  for (const file of authenticatedPageFiles) {
    const route = routeFromPageFile(file);
    const prefixed = route === '/admin' || route.startsWith('/admin/') ||
      route === '/platform-admin' || route.startsWith('/platform-admin/') ||
      route === '/admin-command';
    const outside = outsideSources.has(route);
    const signalled = privilegeSignal.test(readFileSync(resolve(root, file), 'utf8'));
    if ((prefixed || outside || signalled) && !exclusions.has(file)) privilegedPageCandidates.add(file);
  }
  for (const file of pageEntryFiles) {
    if (existsSync(resolve(root, file))) privilegedPageCandidates.add(file);
  }

  const apiRouteFiles = listFiles(root, 'src/app/api', (path) => path.endsWith('/route.ts'));
  const apiMethodsByFile: Record<string, string[]> = {};
  const privilegedApiCandidateFiles = new Set<string>();
  const apiEntries = asArray(bundle.api.sources, 'api.sources').map((entry, index) => asObject(entry, `api.sources[${index}]`));
  const apiEntryFiles = new Set(apiEntries.map((entry, index) => asString(entry.source_file, `api.sources[${index}].source_file`)));
  const apiEntryRoutes = apiEntries.map((entry, index) => asString(entry.source_route, `api.sources[${index}].source_route`));
  const apiExclusions = new Set(
    asArray(asObject(bundle.api.discovery, 'api.discovery').classified_non_sources, 'api.discovery.classified_non_sources')
      .map((entry, index) => asString(asObject(entry, `api exclusion ${index}`).source_file, `api exclusion ${index}.source_file`)),
  );
  const apiSignal = /platform_admin|operator|leader|requireRoleApi|ALLOWED_ROLES|ROLE_GUARD|APPROVAL_ROLES|INVITE_ROLES|TEAM_ROLES|FORBIDDEN/;
  for (const file of apiRouteFiles) {
    const source = readFileSync(resolve(root, file), 'utf8');
    apiMethodsByFile[file] = extractHttpMethods(source);
    const route = routeFromApiFile(file);
    const prefixed = route === '/api/v1/admin-command' || route.startsWith('/api/v1/admin/') ||
      route.startsWith('/api/v1/platform-admin/') || route === '/api/v1/platform-admin';
    if ((prefixed || apiSignal.test(source)) && !apiExclusions.has(file)) privilegedApiCandidateFiles.add(file);
  }
  for (const file of apiEntryFiles) {
    if (existsSync(resolve(root, file))) privilegedApiCandidateFiles.add(file);
  }

  return {
    authenticatedPageFiles,
    privilegedPageFiles: [...privilegedPageCandidates].sort(),
    apiMethodsByFile,
    privilegedApiCandidateFiles: [...privilegedApiCandidateFiles].sort(),
    pageConsumersByRoute: scanRuntimeRouteConsumers(
      root,
      pageEntries.map((entry, index) => asString(entry.source_route, `page.entries[${index}].source_route`)),
    ),
    apiConsumersByRoute: scanRuntimeRouteConsumers(root, apiEntryRoutes),
    consumerSnapshot: scanConsumerSnapshot(root),
  };
}

function validateMetadata(bundle: InventoryBundle, root: string, enforceFrozenDigests: boolean, passes: string[]): void {
  for (const [name, manifest] of Object.entries(bundle)) {
    if (name === 'pipeline' || name === 'decision') continue;
    check(manifest.repository === 'sohoteam88/NextShift-OS-2.0', `${name}: repository identity verified`, passes);
    check(manifest.baseline_sha === BASELINE, `${name}: exact authorized baseline verified`, passes);
    if (enforceFrozenDigests) {
      check(canonicalJsonSha256(manifest) === FROZEN_MANIFEST_SHA256[name], `${name}: frozen manifest content digest verified`, passes);
    }
    const authority = asObject(manifest.authoritative_contract, `${name}.authoritative_contract`);
    check(authority.path === CONTRACT, `${name}: authoritative contract path verified`, passes);
    check(authority.sha256 === sha256(readFileSync(resolve(root, CONTRACT))), `${name}: authoritative contract SHA-256 verified`, passes);
  }
}

function validatePages(bundle: InventoryBundle, observations: InventoryObservations, root: string, passes: string[]): void {
  const expected = asObject(bundle.page.expected_counts, 'page.expected_counts');
  const entries = asArray(bundle.page.entries, 'page.entries').map((entry, index) => asObject(entry, `page.entries[${index}]`));
  check(asNumber(expected.authenticated_page_sources, 'authenticated_page_sources') === APPROVED_COUNTS.authenticatedPages, 'approved authenticated page count frozen at 112', passes);
  check(asNumber(expected.privileged_page_sources, 'privileged_page_sources') === APPROVED_COUNTS.privilegedPages, 'approved privileged page count frozen at 39', passes);
  check(asNumber(expected.retained_terminal_sources, 'retained_terminal_sources') === APPROVED_COUNTS.retainedPageTerminals, 'approved retained terminal count frozen at 17', passes);
  check(asNumber(expected.compatibility_or_migration_sources, 'compatibility_or_migration_sources') === APPROVED_COUNTS.pageRedirects, 'approved compatibility page count frozen at 22', passes);
  check(observations.authenticatedPageFiles.length === APPROVED_COUNTS.authenticatedPages, 'authenticated page total 112 verified', passes);
  check(entries.length === APPROVED_COUNTS.privilegedPages, 'privileged page total 39 verified', passes);
  const pageCensus = asObject(asObject(bundle.page.discovery, 'page.discovery').full_authenticated_page_census, 'page.discovery.full_authenticated_page_census');
  check(pageCensus.count === observations.authenticatedPageFiles.length, 'full authenticated page census count verified', passes);
  check(pageCensus.path_sha256 === canonicalJsonSha256(observations.authenticatedPageFiles), 'full authenticated page path census digest verified', passes);
  asString(pageCensus.policy, 'page census policy');

  const ids = entries.map((entry, index) => asString(entry.stable_id, `page ${index}.stable_id`));
  const routes = entries.map((entry, index) => asString(entry.source_route, `page ${index}.source_route`));
  const files = entries.map((entry, index) => asString(entry.source_file, `page ${index}.source_file`));
  unique(ids, 'page stable IDs');
  unique(routes, 'page source routes');
  unique(files, 'page source files');
  check(true, 'page stable IDs/routes/files are unique', passes);
  assertExactStringSet('privileged page discovery', files, observations.privilegedPageFiles);
  passes.push('repository-wide privileged page discovery is fully classified');

  for (const [index, entry] of entries.entries()) {
    const label = `page ${ids[index]}`;
    const file = files[index];
    check(existsSync(resolve(root, file)), `${label}: source exists`, passes);
    check(routeFromPageFile(file) === routes[index], `${label}: source route/file mapping verified`, passes);
    const frozenBlob = asString(entry.baseline_blob, `${label}.baseline_blob`);
    check(gitBlobAt(root, BASELINE, file) === frozenBlob, `${label}: authorized baseline blob verified`, passes);
    check(gitBlob(root, file) === frozenBlob, `${label}: source unchanged from authorized baseline`, passes);
    asString(entry.current_guard, `${label}.current_guard`);
    asString(entry.current_responsibility, `${label}.current_responsibility`);
    check(['admin', 'superadmin', 'split'].includes(asString(entry.space, `${label}.space`)), `${label}: space classified`, passes);
    check(['ADMIN', 'PLATFORM', 'ADMIN / PLATFORM'].includes(asString(entry.shell_identity, `${label}.shell_identity`)), `${label}: shell identity classified`, passes);
    asString(entry.owner_module, `${label}.owner_module`);
    asString(entry.implementation_risk, `${label}.implementation_risk`);
    const disposition = asString(entry.disposition, `${label}.disposition`);
    check([
      'KEEP_TERMINAL',
      'KEEP_TERMINAL_REQUIRES_ARCH_REVIEW',
      'KEEP_AND_SPLIT_CAPABILITY',
      'LEGACY_301_FROZEN_RESOLVER',
      'LEGACY_301_TERMINAL',
      'LEGACY_301_TERMINAL_REQUIRES_ARCH_REVIEW',
      'LEGACY_301_TO_NEW_TERMINAL',
      'MIGRATE_LEGACY_301',
      'REPLACE_CHAIN_WITH_GUARDED_301',
    ].includes(disposition), `${label}: disposition is approved`, passes);
    const consumers = asStringArray(entry.consumers, `${label}.consumers`, true);
    for (const [consumerIndex, consumer] of consumers.entries()) {
      assertSafeExistingRepoPath(root, consumer, `${label}.consumers[${consumerIndex}]`);
    }
    const observedConsumers = observations.pageConsumersByRoute[routes[index]] ?? [];
    check(observedConsumers.every((consumer) => consumers.includes(consumer)), `${label}: every direct runtime/test route consumer is frozen`, passes);
    asStringArray(entry.required_test_ids, `${label}.required_test_ids`);
    const evidence = asObject(entry.evidence, `${label}.evidence`);
    asString(evidence.contract_section, `${label}.evidence.contract_section`);
    check(asBoolean(evidence.source_exists_at_baseline, `${label}.evidence.source_exists_at_baseline`) === true, `${label}: baseline existence evidence`, passes);
    asString(evidence.runtime_reachability, `${label}.evidence.runtime_reachability`);

    const targets = asArray(entry.targets, `${label}.targets`).map((target, targetIndex) => asObject(target, `${label}.targets[${targetIndex}]`));
    check(targets.length > 0, `${label}: target authority exists`, passes);
    for (const target of targets) {
      const namespace = asString(target.namespace, `${label}.target.namespace`);
      const route = asString(target.route, `${label}.target.route`);
      check(route.startsWith('/'), `${label}: target route is absolute application route`, passes);
      asString(target.capability, `${label}.target.capability`);
      const roles = asStringArray(target.roles, `${label}.target.roles`);
      asString(target.tenant_authority, `${label}.target.tenant_authority`);
      check(asBoolean(target.terminal, `${label}.target.terminal`) === true, `${label}: target is terminal`, passes);
      if (namespace === 'admin') {
        check(route === '/admin' || route.startsWith('/admin/'), `${label}: admin namespace uses /admin target`, passes);
        check(roles.every((role) => role === 'leader' || role === 'operator'), `${label}: admin target uses exact leader/operator subset`, passes);
        check(/session tenant/i.test(asString(target.tenant_authority, `${label}.target.tenant_authority`)), `${label}: admin target tenant is session-derived`, passes);
      } else if (namespace === 'superadmin') {
        check(route === '/superadmin' || route.startsWith('/superadmin/'), `${label}: superadmin namespace uses /superadmin target`, passes);
        assertExactStringSet(`${label}: superadmin target roles`, ['platform_admin'], roles);
        passes.push(`${label}: superadmin target is platform_admin only`);
        const authority = asString(target.tenant_authority, `${label}.target.tenant_authority`);
        check(/platform guard/i.test(authority) && /explicit validated target tenant/i.test(authority), `${label}: superadmin target keeps platform guard and explicit target semantics`, passes);
      } else if (namespace !== 'product') {
        fail(`${label}: unknown target namespace ${namespace}`);
      }
    }
    const namespaces = [...new Set(targets.map((target) => asString(target.namespace, `${label}.target.namespace`)))].sort();
    const space = asString(entry.space, `${label}.space`);
    const shell = asString(entry.shell_identity, `${label}.shell_identity`);
    if (space === 'admin') check(namespaces.length === 1 && namespaces[0] === 'admin' && shell === 'ADMIN', `${label}: admin space/shell matches targets`, passes);
    if (space === 'superadmin') check(namespaces.length === 1 && namespaces[0] === 'superadmin' && shell === 'PLATFORM', `${label}: superadmin space/shell matches targets`, passes);
    if (space === 'split') check(namespaces.join(',') === 'admin,superadmin' && shell === 'ADMIN / PLATFORM', `${label}: split space/shell matches targets`, passes);

    const redirect = asObject(entry.redirect, `${label}.redirect`);
    const redirectMode = asString(redirect.mode, `${label}.redirect.mode`);
    check(redirectMode === 'NONE' || redirectMode === 'LEGACY_GET_301', `${label}: redirect mode classified`, passes);
    check(asBoolean(redirect.terminal, `${label}.redirect.terminal`) === true, `${label}: redirect terminal policy frozen`, passes);
    check(redirect.unknown_query === 'DROP', `${label}: unknown query drops`, passes);
    const queryAllowlist = asArray(redirect.query_allowlist, `${label}.redirect.query_allowlist`).map((item, itemIndex) => asObject(item, `${label}.redirect.query_allowlist[${itemIndex}]`));
    unique(queryAllowlist.map((item) => asString(item.key, `${label}.redirect.query_allowlist.key`)), `${label}.redirect.query_allowlist keys`);
    for (const item of queryAllowlist) {
      asString(item.key, `${label}.redirect.query_allowlist.key`);
      if (item.allowed_values !== undefined) {
        asStringArray(item.allowed_values, `${label}.redirect.query_allowlist.allowed_values`);
      } else {
        check(item.format === 'uuid', `${label}: structured query format is UUID`, passes);
        asString(item.authorization, `${label}.redirect.query_allowlist.authorization`);
      }
    }
    if (redirectMode === 'LEGACY_GET_301') {
      check(redirect.method === 'GET' && redirect.status === 301, `${label}: compatibility is exact GET 301`, passes);
      check(redirect.non_get_policy === 'FAIL_CLOSED_UNLESS_SEPARATELY_APPROVED_EXPIRING_308_PARITY', `${label}: mutations never use 301/302`, passes);
      asText(redirect.notes, `${label}.redirect.notes`);
    }
  }

  const prefixCounts = {
    admin: routes.filter((route) => route === '/admin' || route.startsWith('/admin/')).length,
    platform: routes.filter((route) => route === '/platform-admin' || route.startsWith('/platform-admin/')).length,
    command: routes.filter((route) => route === '/admin-command').length,
    outside: routes.filter((route) => !route.startsWith('/admin') && !route.startsWith('/platform-admin')).length,
  };
  check(prefixCounts.admin === 19, 'page prefix count /admin = 19', passes);
  check(prefixCounts.platform === 14, 'page prefix count /platform-admin = 14', passes);
  check(prefixCounts.command === 1, 'page prefix count /admin-command = 1', passes);
  check(prefixCounts.outside === 5, 'page outside-prefix count = 5', passes);

  const exclusions = asArray(asObject(bundle.page.discovery, 'page.discovery').classified_non_sources, 'page exclusions').map((entry, index) => asObject(entry, `page exclusion ${index}`));
  for (const exclusion of exclusions) {
    const file = asString(exclusion.source_file, 'page exclusion source_file');
    const blob = asString(exclusion.baseline_blob, 'page exclusion baseline_blob');
    check(gitBlobAt(root, BASELINE, file) === blob && gitBlob(root, file) === blob, `page exclusion ${file} remains exact and non-privileged`, passes);
  }

  const redirectModes = entries.map((entry) => asObject(entry.redirect, 'page.redirect').mode);
  check(redirectModes.filter((mode) => mode === 'NONE').length === APPROVED_COUNTS.retainedPageTerminals, '17 retained page terminals verified', passes);
  check(redirectModes.filter((mode) => mode === 'LEGACY_GET_301').length === APPROVED_COUNTS.pageRedirects, '22 compatibility page sources verified', passes);
}

function validateApi(bundle: InventoryBundle, observations: InventoryObservations, root: string, passes: string[]): void {
  const expected = asObject(bundle.api.expected_counts, 'api.expected_counts');
  const sources = asArray(bundle.api.sources, 'api.sources').map((entry, index) => asObject(entry, `api.sources[${index}]`));
  const targetWrites = asArray(bundle.api.target_write_capabilities, 'api.target_write_capabilities').map((entry, index) => asObject(entry, `target write[${index}]`));
  check(asNumber(expected.source_route_files, 'source_route_files') === APPROVED_COUNTS.apiSourceFiles, 'approved API source file count frozen at 37', passes);
  check(asNumber(expected.exported_methods, 'exported_methods') === APPROVED_COUNTS.apiMethods, 'approved API method count frozen at 57', passes);
  check(asNumber(expected.unique_privileged_source_writes, 'unique_privileged_source_writes') === APPROVED_COUNTS.sourceWrites, 'approved source write count frozen at 30', passes);
  check(asNumber(expected.target_write_capabilities, 'target_write_capabilities') === APPROVED_COUNTS.targetWrites, 'approved target write count frozen at 33', passes);
  check(asNumber(expected.admin_target_writes, 'admin_target_writes') === APPROVED_COUNTS.adminWrites, 'approved admin write count frozen at 23', passes);
  check(asNumber(expected.superadmin_target_writes, 'superadmin_target_writes') === APPROVED_COUNTS.superadminWrites, 'approved superadmin write count frozen at 10', passes);
  check(sources.length === APPROVED_COUNTS.apiSourceFiles, 'API source file total 37 verified', passes);
  const apiCensus = asObject(asObject(bundle.api.discovery, 'api.discovery').full_api_route_census, 'api.discovery.full_api_route_census');
  const allApiRouteFiles = Object.keys(observations.apiMethodsByFile).sort();
  check(apiCensus.count === allApiRouteFiles.length, 'full API route census count verified', passes);
  check(apiCensus.path_sha256 === canonicalJsonSha256(allApiRouteFiles), 'full API route path census digest verified', passes);
  asString(apiCensus.policy, 'API census policy');

  const sourceIds = sources.map((entry, index) => asString(entry.stable_file_id, `api source ${index}.stable_file_id`));
  const sourceFiles = sources.map((entry, index) => asString(entry.source_file, `api source ${index}.source_file`));
  unique(sourceIds, 'API source stable IDs');
  unique(sourceFiles, 'API source files');
  check(true, 'API source stable IDs/files are unique', passes);
  assertExactStringSet('privileged API discovery', sourceFiles, observations.privilegedApiCandidateFiles);
  passes.push('repository-wide privileged API discovery is fully classified');

  const methodEntries: JsonObject[] = [];
  for (const [sourceIndex, source] of sources.entries()) {
    const file = sourceFiles[sourceIndex];
    const sourceLabel = `API source ${sourceIds[sourceIndex]}`;
    check(existsSync(resolve(root, file)), `${sourceLabel} exists`, passes);
    const sourceRoute = asString(source.source_route, `${sourceLabel}.source_route`);
    check(routeFromApiFile(file) === sourceRoute, `${sourceLabel}: source route/file mapping verified`, passes);
    const frozenBlob = asString(source.baseline_blob, `${sourceLabel}.baseline_blob`);
    check(gitBlobAt(root, BASELINE, file) === frozenBlob, `${sourceLabel}: authorized baseline blob verified`, passes);
    check(gitBlob(root, file) === frozenBlob, `${sourceLabel}: source unchanged from authorized baseline`, passes);
    asString(source.current_guard, `${sourceLabel}.current_guard`);
    asString(source.current_tenant_authority, `${sourceLabel}.current_tenant_authority`);
    asString(source.owner_module, `${sourceLabel}.owner_module`);
    asString(source.implementation_risk, `${sourceLabel}.implementation_risk`);
    const sourceEvidence = asObject(source.evidence, `${sourceLabel}.evidence`);
    check(asBoolean(sourceEvidence.source_exists_at_baseline, `${sourceLabel}.evidence.source_exists_at_baseline`) === true, `${sourceLabel}: baseline existence evidence`, passes);
    asString(sourceEvidence.contract_section, `${sourceLabel}.evidence.contract_section`);
    const consumers = asStringArray(source.consumers, `${sourceLabel}.consumers`, true);
    for (const [consumerIndex, consumer] of consumers.entries()) {
      assertSafeExistingRepoPath(root, consumer, `${sourceLabel}.consumers[${consumerIndex}]`);
    }
    const observedConsumers = observations.apiConsumersByRoute[sourceRoute] ?? [];
    check(observedConsumers.every((consumer) => consumers.includes(consumer)), `${sourceLabel}: every direct runtime/test API caller is frozen`, passes);
    const methods = asArray(source.methods, `API source ${sourceIds[sourceIndex]}.methods`).map((entry, index) => asObject(entry, `API method ${sourceIds[sourceIndex]}[${index}]`));
    const frozenMethods = methods.map((entry) => asString(entry.source_method, 'API source_method')).sort();
    assertExactStringSet(`API exported methods ${file}`, frozenMethods, observations.apiMethodsByFile[file] ?? []);
    passes.push(`API exported methods classified: ${file}`);
    for (const method of methods) {
      const methodId = asString(method.stable_capability_id, `${sourceLabel}.method.stable_capability_id`);
      const methodName = asString(method.source_method, `${methodId}.source_method`);
      check(HTTP_METHODS.includes(methodName as typeof HTTP_METHODS[number]), `${methodId}: HTTP method classified`, passes);
      const classification = asString(method.classification, `${methodId}.classification`);
      check(['PRIVILEGED_READ', 'PRIVILEGED_WRITE', 'SHARED_PRODUCT_READ', 'METHOD_SCOPE_SPLIT', 'MUTATING_GET'].includes(classification), `${methodId}: method classification is allowed`, passes);
      const isWrite = asBoolean(method.is_privileged_source_write, `${methodId}.is_privileged_source_write`);
      const expectedWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodName) || methodId === 'METHOD-AUTH-FIX-UID-GET';
      check(isWrite === expectedWrite, `${methodId}: privileged write identity frozen`, passes);
      if (methodId === 'METHOD-AUTH-FIX-UID-GET') check(classification === 'MUTATING_GET', `${methodId}: sole mutating GET classified`, passes);
      else if (isWrite) check(classification === 'PRIVILEGED_WRITE', `${methodId}: write classification frozen`, passes);
      asText(method.notes, `${methodId}.notes`);
      asStringArray(method.required_test_ids, `${methodId}.required_test_ids`);
      const targetIds = asStringArray(method.target_write_capability_ids, `${methodId}.target_write_capability_ids`, !isWrite);
      const readTargets = asArray(method.targets, `${methodId}.targets`).map((target, targetIndex) => asObject(target, `${methodId}.targets[${targetIndex}]`));
      check(isWrite ? readTargets.length === 0 && targetIds.length > 0 : readTargets.length > 0 && targetIds.length === 0, `${methodId}: read/write target representation is consistent`, passes);
      for (const target of readTargets) {
        const route = asString(target.route, `${methodId}.target.route`);
        check(route.startsWith('/api/v1/'), `${methodId}: target route is API route`, passes);
        const targetMethod = asString(target.method, `${methodId}.target.method`);
        check(HTTP_METHODS.includes(targetMethod as typeof HTTP_METHODS[number]), `${methodId}: target method classified`, passes);
        check(targetMethod === methodName, `${methodId}: read target preserves source HTTP method`, passes);
        const namespace = asString(target.namespace, `${methodId}.target.namespace`);
        check(['product', 'admin', 'superadmin'].includes(namespace), `${methodId}: target namespace classified`, passes);
        const roles = asStringArray(target.roles, `${methodId}.target.roles`);
        asString(target.tenant_authority, `${methodId}.target.tenant_authority`);
        asString(target.capability, `${methodId}.target.capability`);
        asString(target.compatibility, `${methodId}.target.compatibility`);
        if (namespace === 'admin') {
          check(route.startsWith('/api/v1/admin/'), `${methodId}: admin read target uses admin namespace`, passes);
          check(roles.every((role) => role === 'leader' || role === 'operator'), `${methodId}: admin read roles are exact leader/operator subset`, passes);
        }
        if (namespace === 'superadmin') {
          check(route.startsWith('/api/v1/superadmin/'), `${methodId}: superadmin read target uses superadmin namespace`, passes);
          assertExactStringSet(`${methodId}: superadmin read roles`, ['platform_admin'], roles);
        }
        if (namespace === 'product') check(!route.startsWith('/api/v1/admin/') && !route.startsWith('/api/v1/superadmin/'), `${methodId}: product read target stays outside privileged namespaces`, passes);
      }
    }
    methodEntries.push(...methods);
  }
  check(methodEntries.length === APPROVED_COUNTS.apiMethods, 'method-level API total 57 verified', passes);
  const methodIds = methodEntries.map((entry, index) => asString(entry.stable_capability_id, `method ${index}.stable_capability_id`));
  unique(methodIds, 'method stable capability IDs');
  check(true, 'method stable capability IDs are unique', passes);
  const sourceWrites = methodEntries.filter((entry) => entry.is_privileged_source_write === true);
  check(sourceWrites.length === APPROVED_COUNTS.sourceWrites, 'unique privileged source writes = 30', passes);

  check(targetWrites.length === APPROVED_COUNTS.targetWrites, 'target write capabilities = 33', passes);
  const targetIds = targetWrites.map((entry, index) => asString(entry.stable_target_id, `target ${index}.stable_target_id`));
  unique(targetIds, 'target write stable IDs');
  check(true, 'target write stable IDs are unique', passes);
  const targetIdSet = new Set(targetIds);
  for (const methodEntry of methodEntries) {
    for (const targetIdValue of asArray(methodEntry.target_write_capability_ids, 'method.target_write_capability_ids')) {
      const targetId = asString(targetIdValue, 'target_write_capability_id');
      check(targetIdSet.has(targetId), `method target reference exists: ${targetId}`, passes);
    }
  }
  const methodIdSet = new Set(methodIds);
  const targetsByMethod = new Map<string, string[]>();
  for (const target of targetWrites) {
    const targetId = asString(target.stable_target_id, 'target.stable_target_id');
    const sourceMethod = asString(target.source_method_id, 'target.source_method_id');
    check(methodIdSet.has(sourceMethod), `target source method exists: ${sourceMethod}`, passes);
    targetsByMethod.set(sourceMethod, [...(targetsByMethod.get(sourceMethod) ?? []), targetId]);

    const targetRoute = asString(target.target_route, `${targetId}.target_route`);
    const targetMethod = asString(target.target_method, `${targetId}.target_method`);
    check(['POST', 'PUT', 'PATCH', 'DELETE'].includes(targetMethod), `${targetId}: target method is a write`, passes);
    const namespace = asString(target.target_namespace, `${targetId}.target_namespace`);
    check(namespace === 'admin' || namespace === 'superadmin', `${targetId}: target namespace classified`, passes);
    check(targetRoute.startsWith(`/api/v1/${namespace}/`), `${targetId}: route matches target namespace`, passes);
    const roles = asStringArray(target.target_roles, `${targetId}.target_roles`);
    const tenantAuthority = asString(target.tenant_authority, `${targetId}.tenant_authority`);
    if (namespace === 'admin') {
      check(roles.every((role) => role === 'leader' || role === 'operator'), `${targetId}: admin roles are exact leader/operator subset`, passes);
      check(/session tenant/i.test(tenantAuthority) && /predicate/i.test(tenantAuthority), `${targetId}: admin tenant authority is session-derived and predicate-bound`, passes);
    } else {
      assertExactStringSet(`${targetId}: superadmin target roles`, ['platform_admin'], roles);
      check(/platform_admin/i.test(tenantAuthority) && /explicit validated target tenant/i.test(tenantAuthority), `${targetId}: superadmin target semantics preserve platform guard and explicit resource target`, passes);
    }
    check(target.mutation_compatibility === 'MIGRATE_CALLERS_THEN_FAIL_CLOSED_OLD_METHOD; NO_301_OR_302; 308_ONLY_BY_SEPARATE_EXPIRING_PARITY_APPROVAL', `${targetId}: mutation compatibility fails closed without 301/302`, passes);
    asStringArray(target.required_test_ids, `${targetId}.required_test_ids`);
    const audit = asObject(target.audit, `${targetId}.audit`);
    asBoolean(audit.current_direct_or_transitive, `${targetId}.audit.current_direct_or_transitive`);
    asString(audit.requirement, `${targetId}.audit.requirement`);
    asString(audit.scope, `${targetId}.audit.scope`);
  }
  for (const methodEntry of methodEntries) {
    const methodId = asString(methodEntry.stable_capability_id, 'method.stable_capability_id');
    const declared = asStringArray(methodEntry.target_write_capability_ids, `${methodId}.target_write_capability_ids`, methodEntry.is_privileged_source_write !== true).sort();
    const reciprocal = (targetsByMethod.get(methodId) ?? []).sort();
    assertExactStringSet(`${methodId}: reciprocal target mapping`, declared, reciprocal);
    passes.push(`${methodId}: reciprocal target mapping verified`);
  }
  unique(targetWrites.map((target) => `${asString(target.target_method, 'target.target_method')} ${asString(target.target_route, 'target.target_route')}`), 'target route/method identities');
  passes.push('target route/method identities are unique');

  const adminWrites = targetWrites.filter((entry) => entry.target_namespace === 'admin');
  const superWrites = targetWrites.filter((entry) => entry.target_namespace === 'superadmin');
  check(adminWrites.length === APPROVED_COUNTS.adminWrites, 'admin target writes = 23', passes);
  check(superWrites.length === APPROVED_COUNTS.superadminWrites, 'superadmin target writes = 10', passes);
  check(adminWrites.length + superWrites.length - asNumber(expected.split_source_writes, 'split_source_writes') === sourceWrites.length, '30 to 33 split arithmetic verified', passes);
  const splitIds = asArray(bundle.api.split_source_method_ids, 'split_source_method_ids').map((value, index) => asString(value, `split id ${index}`));
  assertExactStringSet('split source identities', ['METHOD-ADMIN-FEEDBACK-ID-PATCH','METHOD-ADMIN-USERS-ID-PATCH','METHOD-ADMIN-USERS-ID-DELETE'], splitIds);
  passes.push('three approved split source identities verified');

  const auditCurrent = (entry: JsonObject) => asObject(entry.audit, 'target.audit').current_direct_or_transitive === true;
  check(adminWrites.filter(auditCurrent).length === asNumber(expected.admin_existing_audit_coverage, 'admin_existing_audit_coverage'), 'admin existing audit coverage = 5/23', passes);
  check(superWrites.filter(auditCurrent).length === asNumber(expected.superadmin_existing_audit_coverage, 'superadmin_existing_audit_coverage'), 'superadmin existing audit coverage = 4/10', passes);
  const currentAuditedTargetIds = targetWrites.filter(auditCurrent).map((entry) => asString(entry.stable_target_id, 'target.stable_target_id'));
  assertExactStringSet('existing audited target identities', [
    'TARGET-ADMIN-004',
    'TARGET-ADMIN-006',
    'TARGET-ADMIN-007',
    'TARGET-ADMIN-008',
    'TARGET-ADMIN-009',
    'TARGET-SUPER-002',
    'TARGET-SUPER-003',
    'TARGET-SUPER-004',
    'TARGET-SUPER-005',
  ], currentAuditedTargetIds);
  passes.push('existing audited target identities verified');
  for (const target of adminWrites) {
    const roles = asStringArray(target.target_roles, 'admin target roles');
    check(roles.every((role) => role === 'leader' || role === 'operator'), `${asString(target.stable_target_id, 'target id')}: admin target exact-role boundary`, passes);
    const requirement = asString(asObject(target.audit, 'admin target audit').requirement, 'admin audit requirement');
    check(requirement === 'PRESERVE_EXISTING_APPROVED_AUDIT' || requirement === 'NO_NEW_AUDIT_AUTHORIZED_BY_THIS_AMENDMENT', `${asString(target.stable_target_id, 'target id')}: team audit scope not silently expanded`, passes);
    check(asObject(target.audit, 'admin target audit').scope === 'TENANT', `${asString(target.stable_target_id, 'target id')}: admin audit scope remains TENANT`, passes);
  }
  for (const target of superWrites) {
    const roles = asArray(target.target_roles, 'super target roles').map((value, index) => asString(value, `super target role ${index}`));
    assertExactStringSet('superadmin target roles', ['platform_admin'], roles);
    const audit = asObject(target.audit, 'super target audit');
    check(audit.requirement === 'SUCCESS_AND_FAILURE_AUDIT_REQUIRED' && audit.scope === 'TENANT_OR_PLATFORM_PER_REVIEWED_DECISION', `${asString(target.stable_target_id, 'target id')}: superadmin success/failure audit and scope required`, passes);
    assertExactStringSet(`${asString(target.stable_target_id, 'target id')}: superadmin audit fields`, ['actorId','actorRole','action','targetType','targetId','targetTenantId','correlationId','outcome','redactedMetadata','timestamp'], asStringArray(audit.required_fields, 'super audit required_fields'));
    passes.push(`${asString(target.stable_target_id, 'target id')}: superadmin audit fields verified`);
    check(audit.delivery_authority === 'shared direct/replay idempotency key and payload digest with AuditEventOutbox fallback', `${asString(target.stable_target_id, 'target id')}: durable audit delivery authority frozen`, passes);
  }
  check(superWrites.length === asNumber(expected.superadmin_required_success_failure_audit, 'superadmin_required_success_failure_audit'), 'superadmin 10/10 audit requirement verified', passes);

  const exclusions = asArray(asObject(bundle.api.discovery, 'api.discovery').classified_non_sources, 'api exclusions').map((entry, index) => asObject(entry, `api exclusion ${index}`));
  for (const exclusion of exclusions) {
    const file = asString(exclusion.source_file, 'api exclusion source_file');
    const blob = asString(exclusion.baseline_blob, 'api exclusion baseline_blob');
    check(gitBlobAt(root, BASELINE, file) === blob && gitBlob(root, file) === blob, `API exclusion ${file} remains exact product API`, passes);
  }
}

function validateRedirects(bundle: InventoryBundle, observations: InventoryObservations, root: string, passes: string[]): void {
  const expected = asObject(bundle.redirect.expected_counts, 'redirect.expected_counts');
  const redirects = asArray(bundle.redirect.redirect_entries, 'redirect.redirect_entries').map((entry, index) => asObject(entry, `redirect ${index}`));
  check(asNumber(expected.legacy_page_redirects, 'legacy_page_redirects') === APPROVED_COUNTS.pageRedirects, 'approved legacy page redirect count frozen at 22', passes);
  check(redirects.length === APPROVED_COUNTS.pageRedirects, 'legacy page redirect total 22 verified', passes);
  const ids = redirects.map((entry, index) => asString(entry.stable_id, `redirect ${index}.stable_id`));
  const sourceRoutes = redirects.map((entry, index) => asString(entry.source_route, `redirect ${index}.source_route`));
  unique(ids, 'redirect stable IDs');
  unique(sourceRoutes, 'redirect source routes');
  check(true, 'redirect stable IDs/source routes are unique', passes);
  const sourceSet = new Set(sourceRoutes);
  const pageEntries = asArray(bundle.page.entries, 'page.entries').map((entry, index) => asObject(entry, `page ${index}`));
  const pageById = new Map(pageEntries.map((entry) => [asString(entry.stable_id, 'page.stable_id'), entry]));
  const terminalTargetRoutes = new Set(pageEntries.flatMap((entry) =>
    asArray(entry.targets, 'page.targets').map((target, index) => asObject(target, `page.target ${index}`))
      .filter((target) => target.terminal === true)
      .map((target) => asString(target.route, 'page.target.route')),
  ));
  for (const redirect of redirects) {
    const id = asString(redirect.stable_id, 'redirect.stable_id');
    check(redirect.method === 'GET' && redirect.required_status === 301 && redirect.terminal === true, `${id}: GET 301 terminal policy`, passes);
    check(redirect.unknown_query === 'DROP', `${id}: unknown query drops`, passes);
    check(redirect.non_get_policy === 'FAIL_CLOSED_UNLESS_SEPARATELY_APPROVED_EXPIRING_308_PARITY', `${id}: non-GET compatibility fails closed and never uses 301/302`, passes);
    asText(redirect.notes, `${id}.notes`);
    asStringArray(redirect.required_test_ids, `${id}.required_test_ids`);
    const sourceFile = assertSafeExistingRepoPath(root, redirect.source_file, `${id}.source_file`);
    const sourcePageId = asString(redirect.source_page_id, `${id}.source_page_id`);
    const sourcePage = pageById.get(sourcePageId);
    check(sourcePage !== undefined, `${id}: source page identity exists`, passes);
    check(sourcePage.source_file === sourceFile && sourcePage.source_route === redirect.source_route && sourcePage.current_guard === redirect.current_guard, `${id}: source page/file/guard identity matches page inventory`, passes);
    const pageRedirect = asObject(sourcePage.redirect, `${id}.page_redirect`);
    check(pageRedirect.mode === 'LEGACY_GET_301' && pageRedirect.method === 'GET' && pageRedirect.status === 301, `${id}: page inventory carries same 301 decision`, passes);

    const queryAllowlist = asArray(redirect.query_allowlist, `${id}.query_allowlist`).map((entry, index) => asObject(entry, `${id}.query_allowlist[${index}]`));
    check(queryAllowlist.length > 0, `${id}: explicit query allowlist exists`, passes);
    unique(queryAllowlist.map((entry) => asString(entry.key, `${id}.query_allowlist.key`)), `${id}.query_allowlist keys`);
    for (const item of queryAllowlist) {
      if (item.allowed_values !== undefined) asStringArray(item.allowed_values, `${id}.query_allowlist.allowed_values`);
      else {
        check(item.format === 'uuid', `${id}: structured query format is UUID`, passes);
        asString(item.authorization, `${id}.query_allowlist.authorization`);
      }
    }
    check(canonicalJsonSha256(queryAllowlist) === canonicalJsonSha256(asArray(pageRedirect.query_allowlist, `${id}.page_query_allowlist`)), `${id}: redirect/page query policies match`, passes);

    const targetRoutes = asStringArray(redirect.target_routes, `${id}.target_routes`);
    const pageTargets = asArray(sourcePage.targets, `${id}.page_targets`).map((target, index) => asObject(target, `${id}.page_targets[${index}]`));
    assertExactStringSet(`${id}: redirect/page targets`, targetRoutes, pageTargets.map((target) => asString(target.route, `${id}.page_target.route`)));
    passes.push(`${id}: redirect/page targets match`);
    for (const targetValue of asArray(redirect.target_routes, `${id}.target_routes`)) {
      const target = asString(targetValue, `${id}.target`).split('?')[0];
      check(!sourceSet.has(target), `${id}: destination is not another redirect source`, passes);
      check(terminalTargetRoutes.has(target), `${id}: destination is a frozen terminal target`, passes);
    }
    const roles = asStringArray(redirect.target_roles, `${id}.target_roles`);
    assertExactStringSet(`${id}: redirect/page target roles`, roles, [...new Set(pageTargets.flatMap((target) => asStringArray(target.roles, `${id}.page_target.roles`)))]);
    passes.push(`${id}: redirect/page roles match`);
    if (redirect.target_space === 'superadmin') {
      assertExactStringSet(`${id}: super target roles`, ['platform_admin'], roles);
      passes.push(`${id}: superadmin role boundary`);
    } else {
      check(redirect.target_space === 'admin' && roles.every((role) => role === 'leader' || role === 'operator'), `${id}: admin redirect uses exact leader/operator subset`, passes);
    }
  }

  const expectedSnapshot = asArray(bundle.redirect.consumer_snapshot, 'redirect.consumer_snapshot').map((entry, index) => {
    const row = asObject(entry, `consumer row ${index}`);
    return {
      path: asString(row.path, 'consumer.path'),
      literal: asString(row.literal, 'consumer.literal'),
      count: asNumber(row.count, 'consumer.count'),
      kind: asString(row.kind, 'consumer.kind'),
      resolution_group_id: asString(row.resolution_group_id, 'consumer.resolution_group_id'),
    };
  }).sort((a,b)=>consumerKey(a).localeCompare(consumerKey(b)));
  for (const [index, row] of expectedSnapshot.entries()) assertSafeExistingRepoPath(root, row.path, `consumer row ${index}.path`);
  assertExactStringSet('literal consumer snapshot', expectedSnapshot.map(consumerKey), observations.consumerSnapshot.map(consumerKey));
  passes.push('all code/test/doc/bookmark/navigation route-literal consumers classified');
  check(expectedSnapshot.length === asNumber(expected.literal_consumer_rows, 'literal_consumer_rows'), 'consumer row count frozen', passes);
  check(new Set(expectedSnapshot.map((row) => row.path)).size === asNumber(expected.literal_consumer_files, 'literal_consumer_files'), 'consumer file count frozen', passes);
  check(expectedSnapshot.reduce((sum, row) => sum + row.count, 0) === asNumber(expected.literal_consumer_occurrences, 'literal_consumer_occurrences'), 'consumer occurrence count frozen', passes);
  check(expectedSnapshot.every((row) => row.resolution_group_id !== 'CONSUMER-REVIEW-REQUIRED'), 'no consumer remains unclassified', passes);

  const groups = asArray(bundle.redirect.resolution_groups, 'redirect.resolution_groups').map((entry, index) => asObject(entry, `resolution group ${index}`));
  const groupIds = groups.map((group, index) => asString(group.id, `resolution group ${index}.id`));
  unique(groupIds, 'consumer resolution group IDs');
  for (const group of groups) {
    asString(group.scope, 'resolution group.scope');
    asString(group.target, 'resolution group.target');
    asString(group.disposition, 'resolution group.disposition');
    asStringArray(group.required_test_ids, 'resolution group.required_test_ids');
  }
  check(expectedSnapshot.every((row) => groupIds.includes(row.resolution_group_id)), 'every consumer references a declared resolution group', passes);

  const invariants = asObject(bundle.redirect.invariants, 'redirect.invariants');
  check(invariants.page_get_compatibility === 'single-hop terminal 301 after exact source authorization', 'redirect single-hop 301 invariant frozen', passes);
  check(invariants.mutation_policy === 'never 301/302; old mutation fails closed unless separately approved expiring 308 parity', 'redirect mutation invariant frozen', passes);
  check(invariants.member_frontend === 'zero /admin, /superadmin, /platform-admin, /admin-command, /team, /team/members, or /workspace backend links', 'member frontend zero-backend invariant frozen', passes);
  check(invariants.space_isolation === '/admin and /superadmin never weaken or inherit each other\'s role authority', 'admin/superadmin isolation invariant frozen', passes);
  asString(invariants.query_policy, 'redirect.invariants.query_policy');

  const navAuthorities = asArray(bundle.redirect.member_navigation_authorities, 'redirect.member_navigation_authorities').map((entry, index) => asObject(entry, `member nav authority ${index}`));
  check(navAuthorities.length === 5, 'five mounted/historical member navigation authorities frozen', passes);
  const navPaths = navAuthorities.map((entry, index) => assertSafeExistingRepoPath(root, entry.path, `member nav authority ${index}.path`));
  unique(navPaths, 'member navigation authority paths');
  for (const [index, authority] of navAuthorities.entries()) {
    asString(authority.role, `member nav authority ${index}.role`);
    asString(authority.current_result, `member nav authority ${index}.current_result`);
    const blob = asString(authority.baseline_blob, `member nav authority ${index}.baseline_blob`);
    check(gitBlobAt(root, BASELINE, navPaths[index]) === blob && gitBlob(root, navPaths[index]) === blob, `member navigation authority remains baseline-exact: ${navPaths[index]}`, passes);
  }
  const sidebarMounts = trackedTextFiles(root).filter((path) => path.startsWith('src/') && path !== 'src/components/layouts/Sidebar.tsx').filter((path) => {
    const source = readTrackedText(root, path);
    return source !== undefined && /(?:from\s+['"][^'"]*\/Sidebar['"]|<Sidebar(?:\s|>))/.test(source);
  });
  check(sidebarMounts.length === 0, 'historical Sidebar remains unmounted', passes);
}

function findTask(pipeline: JsonObject, id: string): JsonObject {
  for (const waveValue of asArray(pipeline.waves, 'pipeline.waves')) {
    const wave = asObject(waveValue, 'pipeline wave');
    for (const taskValue of asArray(wave.tasks, 'pipeline wave.tasks')) {
      const task = asObject(taskValue, 'pipeline task');
      if (task.id === id) return task;
    }
  }
  fail(`pipeline task ${id} missing`);
}

function findWave(pipeline: JsonObject, id: string): JsonObject {
  for (const waveValue of asArray(pipeline.waves, 'pipeline.waves')) {
    const wave = asObject(waveValue, 'pipeline wave');
    if (wave.id === id) return wave;
  }
  fail(`pipeline wave ${id} missing`);
}

function validateSecurity(bundle: InventoryBundle, root: string, passes: string[]): void {
  const u3a = findTask(bundle.pipeline, 'U3A');
  const u3adr = findTask(bundle.pipeline, 'U3ADR');
  const u3b = findTask(bundle.pipeline, 'U3B');
  const e3a = findTask(bundle.pipeline, 'E3A');
  const e3b = findTask(bundle.pipeline, 'E3B');
  const w3 = findWave(bundle.pipeline, 'W3');
  check(w3.status === 'running', 'Manifest W3 remains running', passes);
  check(u3a.status === 'pending', 'Manifest U3A remains pending in inventory PR', passes);
  check(u3adr.status === 'pending', 'Manifest U3ADR remains pending', passes);
  check(u3b.status === 'blocked', 'Manifest U3B remains blocked', passes);
  check(e3a.status === 'pending' && e3b.status === 'pending', 'Manifest E3A/E3B remain pending', passes);
  const checkpoint = asObject(w3.checkpoint, 'W3 checkpoint');
  check(checkpoint.id === 'AR-W3' && checkpoint.status === 'pending', 'AR-W3 remains pending', passes);
  const finalAudit = asObject(bundle.pipeline.final_audit, 'pipeline.final_audit');
  check(finalAudit.id === 'AUDIT-OS3.8' && finalAudit.status === 'pending', 'Final Audit remains pending', passes);
  const releaseGate = asObject(bundle.pipeline.release_gate, 'pipeline.release_gate');
  check(releaseGate.status === 'blocked' && releaseGate.auto_tag === false && releaseGate.auto_deploy === false, 'release/tag/deploy gate remains blocked', passes);
  const executionPolicy = asObject(bundle.pipeline.execution_policy, 'pipeline.execution_policy');
  check(executionPolicy.auto_release === false && executionPolicy.auto_deploy === false, 'automatic release/deploy remain disabled', passes);

  const governance = asObject(u3adr.governance_gate, 'U3ADR governance_gate');
  const policy = asObject(governance.policy, 'U3ADR governance policy');
  check(policy.gate_id === 'U3-AUDITLOG-ADR' && policy.gate_task_id === 'U3ADR' && policy.consumer_task_id === 'U3B', 'immutable gate/task/consumer identities verified', passes);
  const policyDigest = canonicalJsonSha256(policy);
  const protectedPaths = asArray(policy.protected_paths, 'policy.protected_paths').map((value, index) => asString(value, `protected path ${index}`));
  unique(protectedPaths, 'immutable protected paths');
  for (const [index, path] of protectedPaths.entries()) assertSafeRepoPath(path, `protected path ${index}`);
  const protectedDigest = canonicalJsonSha256([...protectedPaths].sort());
  const auditBoundary = asObject(bundle.security.auditlog_outbox_boundary, 'security.auditlog_outbox_boundary');
  check(policyDigest === auditBoundary.immutable_policy_sha256, 'immutable policy SHA-256 verified', passes);
  check(protectedDigest === auditBoundary.protected_paths_sha256, 'protected-path SHA-256 verified', passes);
  check(bundle.decision.policy_sha256 === policyDigest, 'reviewed decision policy digest verified', passes);
  check(bundle.decision.protected_paths_sha256 === protectedDigest, 'reviewed decision protected-path digest verified', passes);
  check(bundle.decision.selected_option === 'A_OPTIONAL_TENANT_WITH_SCOPE', 'reviewed Option A boundary verified', passes);
  check(bundle.decision.gate_id === 'U3-AUDITLOG-ADR' && bundle.decision.task_id === 'U3ADR' && bundle.decision.consumer_task_id === 'U3B', 'reviewed decision identities verified', passes);
  check(sha256(readFileSync(resolve(root, DECISION_ARTIFACT))) === auditBoundary.decision_artifact_sha256, 'reviewed decision artifact byte digest verified', passes);
  check(auditBoundary.immutable_policy_version === policy.policy_version && bundle.decision.policy_version === policy.policy_version, 'immutable policy version is consistent', passes);

  const requiredDecisionIds = asStringArray(policy.required_decisions, 'policy.required_decisions');
  const boundaryDecisionIds = asStringArray(auditBoundary.required_decisions, 'audit.required_decisions');
  const reviewedDecisions = asArray(bundle.decision.required_decisions, 'decision.required_decisions').map((entry, index) => asObject(entry, `decision.required_decisions[${index}]`));
  const reviewedDecisionIds = reviewedDecisions.map((entry, index) => asString(entry.id, `decision.required_decisions[${index}].id`));
  assertExactStringSet('audit/policy required decisions', requiredDecisionIds, boundaryDecisionIds);
  assertExactStringSet('decision/policy required decisions', requiredDecisionIds, reviewedDecisionIds);
  passes.push('six required ADR decisions match policy, decision, and security boundary');
  check(requiredDecisionIds.length === 6, 'six immutable ADR decisions frozen', passes);
  for (const decision of reviewedDecisions) {
    check(decision.status === 'resolved', `${asString(decision.id, 'decision.id')}: reviewed decision resolved`, passes);
    asString(decision.decision, `${asString(decision.id, 'decision.id')}.decision`);
  }

  const frozenProtected = asArray(bundle.security.immutable_policy_protected_paths, 'security.immutable_policy_protected_paths')
    .map((value, index) => asString(value, `security protected path ${index}`));
  assertExactStringSet('security protected paths', protectedPaths, frozenProtected);
  passes.push('security manifest matches immutable protected paths');

  const securityInvariants = asObject(bundle.security.invariants, 'security.invariants');
  check(securityInvariants.protected_path_coverage === 'every immutable policy protected path is covered by at least one authority entry', 'protected-path coverage invariant frozen', passes);
  check(securityInvariants.authority_source_paths_sha256 === SECURITY_AUTHORITY_PATHS_SHA256, 'security authority source-path digest frozen', passes);
  check(securityInvariants.no_product_implementation === 'U3A records current gaps and U3B acceptance only', 'U3A evidence-only invariant frozen', passes);
  check(securityInvariants.u3adr_pending === true && securityInvariants.u3b_blocked === true && securityInvariants.e3_pending === true, 'downstream governance/product gates remain closed', passes);

  const authorities = asArray(bundle.security.authority_entries, 'security.authority_entries').map((entry, index) => asObject(entry, `authority ${index}`));
  const authorityIds = authorities.map((entry, index) => asString(entry.stable_id, `authority ${index}.stable_id`));
  unique(authorityIds, 'security authority stable IDs');
  check(true, 'security authority stable IDs are unique', passes);
  const frozenAuthorityPaths = authorities.map((authority) => ({
    stable_id: asString(authority.stable_id, 'authority.stable_id'),
    source_paths: asStringArray(authority.source_paths, 'authority.source_paths').sort(),
  })).sort((a, b) => a.stable_id.localeCompare(b.stable_id));
  check(canonicalJsonSha256(frozenAuthorityPaths) === SECURITY_AUTHORITY_PATHS_SHA256, 'authority source-path census digest verified', passes);
  for (const authority of authorities) {
    asString(authority.authority_class, 'authority.authority_class');
    asString(authority.current_state, 'authority.current_state');
    asString(authority.required_enforcement, 'authority.required_enforcement');
    asStringArray(authority.required_test_ids, 'authority.required_test_ids');
    for (const path of asStringArray(authority.source_paths, 'authority.source_paths')) {
      assertSafeRepoPath(path, 'authority.source_path');
      check(!['src', 'docs', 'prisma'].includes(path), `authority path is not an overbroad root: ${path}`, passes);
      check(existsSync(resolve(root, path)) || path === 'src/app/api/v1/superadmin', `authority path exists or is the frozen future superadmin namespace: ${path}`, passes);
    }
  }
  for (const protectedPath of protectedPaths) {
    const covered = authorities.some((authority) =>
      asArray(authority.source_paths, 'authority.source_paths')
        .map((value, index) => asString(value, `authority source path ${index}`))
        .some((sourcePath) => protectedPath === sourcePath || protectedPath.startsWith(`${sourcePath}/`)),
    );
    check(covered, `protected authority classified: ${protectedPath}`, passes);
  }

  const roleMatrix = asArray(bundle.security.role_space_matrix, 'security.role_space_matrix').map((entry, index) => asObject(entry, `role matrix ${index}`));
  check(roleMatrix.length === 4, 'member/leader/operator/platform_admin role matrix complete', passes);
  const roles = roleMatrix.map((entry, index) => asString(entry.role, `role ${index}`));
  assertExactStringSet('role matrix identities', ['member','leader','operator','platform_admin'], roles);
  passes.push('role matrix identities verified');
  const expectedRoleMatrix: Record<string, { member_frontend: string; admin: string; superadmin: string }> = {
    member: { member_frontend: 'ALLOW', admin: 'DENY', superadmin: 'DENY' },
    leader: { member_frontend: 'ALLOW', admin: 'ALLOW_ENDPOINT_ALLOWLIST', superadmin: 'DENY' },
    operator: { member_frontend: 'EXPLICIT_PRODUCT_FLOWS_ONLY', admin: 'ALLOW_ENDPOINT_ALLOWLIST', superadmin: 'DENY' },
    platform_admin: { member_frontend: 'EXPLICIT_PRODUCT_FLOWS_ONLY', admin: 'DENY', superadmin: 'ALLOW' },
  };
  for (const row of roleMatrix) {
    const role = asString(row.role, 'role matrix role');
    check(row.member_frontend === expectedRoleMatrix[role].member_frontend && row.admin === expectedRoleMatrix[role].admin && row.superadmin === expectedRoleMatrix[role].superadmin, `${role}: exact role/space matrix verified`, passes);
  }

  const roleInvariants = asArray(bundle.security.role_invariants, 'security.role_invariants').map((entry, index) => asObject(entry, `role invariant ${index}`));
  const roleInvariantIds = roleInvariants.map((entry, index) => asString(entry.id, `role invariant ${index}.id`));
  assertExactStringSet('role invariant identities', ['SEC-ROLE-001', 'SEC-ROLE-002', 'SEC-ROLE-003'], roleInvariantIds);
  passes.push('role invariant identities verified');
  for (const invariant of roleInvariants) {
    asString(invariant.statement, 'role invariant.statement');
    asStringArray(invariant.required_test_ids, 'role invariant.required_test_ids');
    if (invariant.id === 'SEC-ROLE-003') {
      assertExactStringSet('member navigation forbidden prefixes', ['/admin','/superadmin','/platform-admin','/admin-command','/team','/workspace'], asStringArray(invariant.forbidden_prefixes, 'role invariant.forbidden_prefixes'));
      passes.push('member navigation forbidden prefixes frozen');
    } else {
      asString(invariant.forbidden_authority, 'role invariant.forbidden_authority');
    }
  }

  const tenantAuthorities = asArray(bundle.security.tenant_authorities, 'security.tenant_authorities').map((entry, index) => asObject(entry, `tenant authority ${index}`));
  const tenantAuthorityIds = tenantAuthorities.map((entry, index) => asString(entry.id, `tenant authority ${index}.id`));
  assertExactStringSet('tenant authority identities', ['TENANT-ADMIN-PAGE','TENANT-ADMIN-API','TENANT-ADMIN-STORAGE','TENANT-SUPER-TARGET','TENANT-SUPER-GLOBAL'], tenantAuthorityIds);
  passes.push('tenant authority identities verified');
  for (const authority of tenantAuthorities) {
    asString(authority.context, 'tenant authority.context');
    asString(authority.allowed_source, 'tenant authority.allowed_source');
    asStringArray(authority.forbidden_sources, 'tenant authority.forbidden_sources');
    asString(authority.enforcement, 'tenant authority.enforcement');
  }

  const deleted = asObject(bundle.security.deleted_tenant_contract, 'security.deleted_tenant_contract');
  check(deleted.terminal === true && deleted.restore_policy === 'PROHIBITED_IN_OS_3_8; separate reviewed endpoint/ADR/task required', 'deleted tenant terminal/restore boundary frozen', passes);
  check(deleted.state === 'deleted' && deleted.stable_denial_code === 'TENANT_DELETED', 'deleted tenant state/denial code frozen', passes);
  check(asStringArray(deleted.request_checks, 'deleted.request_checks').length === 2, 'deleted tenant request checks frozen', passes);
  check(asStringArray(deleted.worker_checks, 'deleted.worker_checks').length === 2, 'deleted tenant claim and pre-side-effect checks frozen', passes);
  check(asStringArray(deleted.suppressed_effects, 'deleted.suppressed_effects').length === 8, 'deleted tenant suppression authorities frozen', passes);
  asString(deleted.repeated_delete, 'deleted.repeated_delete');
  check(asStringArray(deleted.required_test_ids, 'deleted.required_test_ids').length === 14, 'deleted tenant acceptance tests frozen', passes);

  check(auditBoundary.selected_option === 'A_OPTIONAL_TENANT_WITH_SCOPE', 'AuditLog Option A selected', passes);
  check(auditBoundary.superadmin_write_requirement === '10/10 success and failure AuditLog evidence', 'superadmin 10/10 audit boundary frozen', passes);
  check(auditBoundary.team_admin_scope === 'preserve existing 5/23 audit behavior; no silent expansion', 'team-admin audit scope remains 5/23', passes);
  const currentState = asObject(auditBoundary.current_state, 'audit.current_state');
  asString(currentState.auditlog_tenant_id, 'audit.current_state.auditlog_tenant_id');
  check(currentState.audit_scope_column === false && currentState.idempotency_key_column === false && currentState.payload_digest_column === false && currentState.audit_event_outbox === false, 'AuditLog baseline schema gaps frozen without implementation', passes);
  check(currentState.direct_auditlog_create_files === 23, 'current direct AuditLog create-file count frozen at 23', passes);
  const databaseContract = asStringArray(auditBoundary.required_database_contract, 'audit.required_database_contract');
  check(databaseContract.length === 9 && canonicalJsonSha256(databaseContract) === AUDIT_DATABASE_CONTRACT_SHA256, 'AuditLog/Outbox/idempotency database acceptance frozen', passes);
  check(asStringArray(auditBoundary.required_test_ids, 'audit.required_test_ids').length === 9, 'AuditLog database acceptance test contract frozen', passes);

  const reviewedGovernance = asObject(bundle.security.reviewed_governance, 'security.reviewed_governance');
  check(reviewedGovernance.pr_url === 'https://github.com/sohoteam88/NextShift-OS-2.0/pull/96' && reviewedGovernance.reviewed_head_sha === '5ab3aead887f6c2c9cc29a0b4b5196a0f8e122f8' && reviewedGovernance.review_id === 4721441810 && reviewedGovernance.verdict === 'PASS' && reviewedGovernance.merge_sha === BASELINE, 'reviewed governance identity verified', passes);
  check(reviewedGovernance.u3adr_adoption_status === 'PENDING' && reviewedGovernance.u3b_dispatch_status === 'BLOCKED', 'reviewed governance leaves U3ADR pending and U3B blocked', passes);
}

export function validateU3AInventory(options: {
  repoRoot: string;
  bundle?: InventoryBundle;
  observations?: InventoryObservations;
}): ValidationReport {
  const root = resolve(options.repoRoot);
  const bundle = options.bundle ?? loadInventoryBundle(root);
  const observations = options.observations ?? buildInventoryObservations(root, bundle);
  const passes: string[] = [];
  validateMetadata(bundle, root, options.bundle === undefined, passes);
  validatePages(bundle, observations, root, passes);
  validateApi(bundle, observations, root, passes);
  validateRedirects(bundle, observations, root, passes);
  validateSecurity(bundle, root, passes);

  const pageEntries = asArray(bundle.page.entries, 'page.entries');
  const apiSources = asArray(bundle.api.sources, 'api.sources').map((entry, index) => asObject(entry, `api source ${index}`));
  const methods = apiSources.flatMap((source) => asArray(source.methods, 'api source.methods'));
  const sourceWrites = methods.map((entry, index) => asObject(entry, `method ${index}`)).filter((entry) => entry.is_privileged_source_write === true);
  const targetWrites = asArray(bundle.api.target_write_capabilities, 'api.target_write_capabilities').map((entry, index) => asObject(entry, `target ${index}`));
  const redirects = asArray(bundle.redirect.redirect_entries, 'redirect.redirect_entries');
  const consumers = asArray(bundle.redirect.consumer_snapshot, 'redirect.consumer_snapshot');
  const protectedPaths = asArray(bundle.security.immutable_policy_protected_paths, 'security.immutable_policy_protected_paths');

  return {
    passes,
    stats: {
      authenticatedPages: observations.authenticatedPageFiles.length,
      privilegedPages: pageEntries.length,
      apiSourceFiles: apiSources.length,
      apiMethods: methods.length,
      sourceWrites: sourceWrites.length,
      targetWrites: targetWrites.length,
      adminWrites: targetWrites.filter((entry) => entry.target_namespace === 'admin').length,
      superadminWrites: targetWrites.filter((entry) => entry.target_namespace === 'superadmin').length,
      redirects: redirects.length,
      consumerRows: consumers.length,
      protectedPaths: protectedPaths.length,
    },
  };
}

function repositoryRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../..');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const report = validateU3AInventory({ repoRoot: repositoryRoot() });
    console.log(`PASS U3A inventory validator: ${report.passes.length} assertions`);
    console.log(JSON.stringify(report.stats, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL U3A inventory validator: ${message}`);
    process.exitCode = 1;
  }
}
