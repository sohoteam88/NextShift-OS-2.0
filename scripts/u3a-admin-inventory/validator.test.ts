import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  InventoryValidationError,
  buildInventoryObservations,
  extractConsumerRouteLiterals,
  loadInventoryBundle,
  normalizeRuntimeRouteLiteral,
  validateU3AInventory,
  type InventoryBundle,
  type InventoryObservations,
} from './validator';

const currentRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// U3A is frozen historical evidence. The exact evidence commit contains both
// the inventories and the unchanged authorized product baseline they census.
const repoRoot = process.env.U3A_FROZEN_ROOT
  ? resolve(process.env.U3A_FROZEN_ROOT)
  : currentRoot;
const baseBundle = loadInventoryBundle(repoRoot);
const baseObservations = buildInventoryObservations(repoRoot, baseBundle);

const bundle = (): InventoryBundle => structuredClone(baseBundle);
const observations = (): InventoryObservations => structuredClone(baseObservations);
const records = (value: unknown): Array<Record<string, unknown>> => value as Array<Record<string, unknown>>;
const record = (value: unknown): Record<string, unknown> => value as Record<string, unknown>;

function rejected(run: () => unknown, expected?: RegExp): void {
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof InventoryValidationError, 'expected InventoryValidationError');
  if (expected) assert.match(thrown.message, expected);
}

describe('U3A frozen inventory fail-closed contract', () => {
  it('actual_repository_inventory_passes', () => {
    const report = validateU3AInventory({ repoRoot, bundle: bundle(), observations: observations() });
    assert.deepEqual(report.stats, {
      authenticatedPages: 112,
      privilegedPages: 39,
      apiSourceFiles: 37,
      apiMethods: 57,
      sourceWrites: 30,
      targetWrites: 33,
      adminWrites: 23,
      superadminWrites: 10,
      redirects: 22,
      consumerRows: 241,
      protectedPaths: 42,
    });
  });

  it('new_privileged_page_source_rejected', () => {
    const observed = observations();
    observed.privilegedPageFiles.push('src/app/(auth)/new-admin/page.tsx');
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('deleted_privileged_page_source_rejected', () => {
    const observed = observations();
    observed.privilegedPageFiles = observed.privilegedPageFiles.slice(1);
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('renamed_privileged_page_source_rejected', () => {
    const observed = observations();
    observed.privilegedPageFiles[0] = 'src/app/(auth)/admin/renamed/page.tsx';
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('new_privileged_api_source_rejected', () => {
    const observed = observations();
    observed.privilegedApiCandidateFiles.push('src/app/api/v1/new-privileged/route.ts');
    observed.apiMethodsByFile['src/app/api/v1/new-privileged/route.ts'] = ['POST'];
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('deleted_privileged_api_source_rejected', () => {
    const observed = observations();
    observed.privilegedApiCandidateFiles = observed.privilegedApiCandidateFiles.slice(1);
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('renamed_privileged_api_source_rejected', () => {
    const observed = observations();
    observed.privilegedApiCandidateFiles[0] = 'src/app/api/v1/admin/renamed/route.ts';
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('new_exported_method_rejected', () => {
    const observed = observations();
    const path = 'src/app/api/v1/admin-command/route.ts';
    observed.apiMethodsByFile[path] = [...observed.apiMethodsByFile[path], 'POST'];
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('missing_exported_method_rejected', () => {
    const observed = observations();
    observed.apiMethodsByFile['src/app/api/v1/admin-command/route.ts'] = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('duplicate_page_stable_id_rejected', () => {
    const candidate = bundle();
    const entries = records(candidate.page.entries);
    entries[1].stable_id = entries[0].stable_id;
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('duplicate_method_stable_id_rejected', () => {
    const candidate = bundle();
    const sources = records(candidate.api.sources);
    const firstMethods = records(sources[0].methods);
    const secondMethods = records(sources[1].methods);
    secondMethods[0].stable_capability_id = firstMethods[0].stable_capability_id;
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('approved_count_drift_rejected', () => {
    const candidate = bundle();
    record(candidate.api.expected_counts).target_write_capabilities = 34;
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('redirect_chain_rejected', () => {
    const candidate = bundle();
    const redirects = records(candidate.redirect.redirect_entries);
    redirects[0].target_routes = [redirects[1].source_route];
    const pages = records(candidate.page.entries);
    const page = pages.find((entry) => entry.stable_id === redirects[0].source_page_id);
    assert.ok(page);
    records(page.targets)[0].route = redirects[1].source_route;
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /destination is not another redirect source/);
  });

  it('missing_query_allowlist_rejected', () => {
    const candidate = bundle();
    const redirects = records(candidate.redirect.redirect_entries);
    redirects[0].query_allowlist = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('platform_role_leak_into_admin_rejected', () => {
    const candidate = bundle();
    const targets = records(candidate.api.target_write_capabilities);
    const adminTarget = targets.find((target) => target.target_namespace === 'admin');
    assert.ok(adminTarget);
    adminTarget.target_roles = ['operator', 'platform_admin'];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('team_admin_audit_scope_expansion_rejected', () => {
    const candidate = bundle();
    const targets = records(candidate.api.target_write_capabilities);
    const unauditedAdmin = targets.find((target) =>
      target.target_namespace === 'admin' &&
      record(target.audit).current_direct_or_transitive === false
    );
    assert.ok(unauditedAdmin);
    record(unauditedAdmin.audit).requirement = 'SUCCESS_AND_FAILURE_AUDIT_REQUIRED';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('superadmin_audit_requirement_weakening_rejected', () => {
    const candidate = bundle();
    const targets = records(candidate.api.target_write_capabilities);
    const superTarget = targets.find((target) => target.target_namespace === 'superadmin');
    assert.ok(superTarget);
    record(superTarget.audit).requirement = 'NO_NEW_AUDIT_AUTHORIZED_BY_THIS_AMENDMENT';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('new_unclassified_consumer_rejected', () => {
    const observed = observations();
    observed.consumerSnapshot.push({
      path: 'src/new-consumer.ts',
      literal: '/platform-admin',
      count: 1,
      kind: 'PRODUCT_CTA_OR_RUNTIME_CONSUMER',
      resolution_group_id: 'CONSUMER-REVIEW-REQUIRED',
    });
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('protected_authority_omission_rejected', () => {
    const candidate = bundle();
    const authorities = records(candidate.security.authority_entries);
    candidate.security.authority_entries = authorities.filter((authority) => authority.stable_id !== 'AUTH-PAYMENT') as never;
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('immutable_policy_digest_mismatch_rejected', () => {
    const candidate = bundle();
    record(candidate.security.auditlog_outbox_boundary).immutable_policy_sha256 = '0'.repeat(64);
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('deleted_tenant_restore_weakening_rejected', () => {
    const candidate = bundle();
    record(candidate.security.deleted_tenant_contract).restore_policy = 'ALLOW';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('full_authenticated_page_census_rejects_unclassified_addition', () => {
    const observed = observations();
    observed.authenticatedPageFiles.push('src/app/(auth)/delegated-admin/page.tsx');
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('full_api_census_rejects_delegated_no_signal_route', () => {
    const observed = observations();
    observed.apiMethodsByFile['src/app/api/v1/delegated-team-admin/route.ts'] = ['POST'];
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('direct_page_consumer_omission_rejected', () => {
    const observed = observations();
    observed.pageConsumersByRoute['/admin'].push('src/new-page-caller.tsx');
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('direct_api_consumer_omission_rejected', () => {
    const observed = observations();
    observed.apiConsumersByRoute['/api/v1/admin/settings'].push('src/new-api-caller.tsx');
    rejected(() => validateU3AInventory({ repoRoot, bundle: bundle(), observations: observed }));
  });

  it('api_source_route_mismatch_rejected', () => {
    const candidate = bundle();
    records(candidate.api.sources)[0].source_route = '/api/v1/admin/forged';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('api_baseline_blob_drift_rejected', () => {
    const candidate = bundle();
    records(candidate.api.sources)[0].baseline_blob = '0'.repeat(40);
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('write_target_tenant_authority_missing_rejected', () => {
    const candidate = bundle();
    records(candidate.api.target_write_capabilities)[0].tenant_authority = '';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('write_target_method_invalid_rejected', () => {
    const candidate = bundle();
    records(candidate.api.target_write_capabilities)[0].target_method = 'TRACE';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('redirect_source_page_mismatch_rejected', () => {
    const candidate = bundle();
    records(candidate.redirect.redirect_entries)[0].source_page_id = 'PAGE-ADMIN-001';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('workspace_launch_readiness_chain_rejected', () => {
    const candidate = bundle();
    const workspace = records(candidate.redirect.redirect_entries).find((entry) => entry.source_route === '/workspace/[...path]');
    assert.ok(workspace);
    workspace.target_routes = [...(workspace.target_routes as string[]), '/admin/launch-readiness'];
    const page = records(candidate.page.entries).find((entry) => entry.stable_id === workspace.source_page_id);
    assert.ok(page);
    page.targets = [...records(page.targets), {
      route: '/admin/launch-readiness',
      namespace: 'admin',
      roles: ['operator'],
      tenant_authority: 'authenticated session tenant only; never query/body/header/local storage',
      capability: 'forbidden cross-space suffix',
      terminal: true,
    }];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /destination is not another redirect source/);
  });

  it('redirect_admin_guest_role_rejected', () => {
    const candidate = bundle();
    const adminRedirect = records(candidate.redirect.redirect_entries).find((entry) => entry.target_space === 'admin');
    assert.ok(adminRedirect);
    adminRedirect.target_roles = ['guest'];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('missing_consumer_resolution_groups_rejected', () => {
    const candidate = bundle();
    candidate.redirect.resolution_groups = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('missing_member_navigation_authority_rejected', () => {
    const candidate = bundle();
    candidate.redirect.member_navigation_authorities = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('member_admin_role_escalation_rejected', () => {
    const candidate = bundle();
    const member = records(candidate.security.role_space_matrix).find((entry) => entry.role === 'member');
    assert.ok(member);
    member.admin = 'ALLOW';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('missing_role_invariants_rejected', () => {
    const candidate = bundle();
    candidate.security.role_invariants = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('missing_tenant_authorities_rejected', () => {
    const candidate = bundle();
    candidate.security.tenant_authorities = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('deleted_tenant_suppression_omission_rejected', () => {
    const candidate = bundle();
    record(candidate.security.deleted_tenant_contract).suppressed_effects = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('audit_database_contract_forgery_rejected', () => {
    const candidate = bundle();
    record(candidate.security.auditlog_outbox_boundary).required_database_contract = Array.from({ length: 9 }, (_, index) => `placeholder-${index}`);
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('overbroad_security_authority_path_rejected', () => {
    const candidate = bundle();
    records(candidate.security.authority_entries)[0].source_paths = ['src'];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('decision_artifact_digest_forgery_rejected', () => {
    const candidate = bundle();
    record(candidate.security.auditlog_outbox_boundary).decision_artifact_sha256 = '0'.repeat(64);
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }));
  });

  it('w3_completion_before_u3a_rejected', () => {
    const candidate = bundle();
    const w3 = records(candidate.pipeline.waves).find((wave) => wave.id === 'W3');
    assert.ok(w3);
    w3.status = 'completed';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /Manifest W3 remains running/);
  });

  it('e3a_start_before_u3b_rejected', () => {
    const candidate = bundle();
    const tasks = records(candidate.pipeline.waves).flatMap((wave) => records(wave.tasks));
    const e3a = tasks.find((task) => task.id === 'E3A');
    assert.ok(e3a);
    e3a.status = 'running';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /Manifest E3A\/E3B remain pending/);
  });

  it('automatic_release_enablement_rejected', () => {
    const candidate = bundle();
    record(candidate.pipeline.execution_policy).auto_release = true;
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /automatic release\/deploy remain disabled/);
  });

  it('page_space_target_mismatch_rejected', () => {
    const candidate = bundle();
    records(candidate.page.entries)[0].space = 'superadmin';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /space\/shell matches targets/);
  });

  it('api_read_method_change_rejected', () => {
    const candidate = bundle();
    const method = records(records(candidate.api.sources)[0].methods)[0];
    records(method.targets)[0].method = 'POST';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /read target preserves source HTTP method/);
  });

  it('admin_audit_platform_scope_rejected', () => {
    const candidate = bundle();
    const target = records(candidate.api.target_write_capabilities).find((entry) => entry.target_namespace === 'admin');
    assert.ok(target);
    record(target.audit).scope = 'PLATFORM';
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /admin audit scope remains TENANT/);
  });

  it('superadmin_audit_fields_omission_rejected', () => {
    const candidate = bundle();
    const target = records(candidate.api.target_write_capabilities).find((entry) => entry.target_namespace === 'superadmin');
    assert.ok(target);
    record(target.audit).required_fields = [];
    rejected(() => validateU3AInventory({ repoRoot, bundle: candidate, observations: observations() }), /required_fields must not be empty/);
  });

  it('bare_markdown_route_reference_discovered', () => {
    assert.deepEqual(extractConsumerRouteLiterals('- TEAM -> /team\n/platform-admin/tenants is legacy'), [
      '/team',
      '/platform-admin/tenants',
    ]);
  });

  it('markdown_link_route_reference_discovered', () => {
    assert.deepEqual(extractConsumerRouteLiterals('[Team](/team) and [Workspace](/workspace/[...path])'), [
      '/team',
      '/workspace/[...path]',
    ]);
  });

  it('method_prefixed_route_reference_discovered', () => {
    assert.deepEqual(extractConsumerRouteLiterals("'GET /team/dashboard -> 200'"), ['/team/dashboard']);
  });

  it('absolute_url_route_reference_discovered', () => {
    assert.deepEqual(extractConsumerRouteLiterals('bookmark https://nextshiftos.com/team/growth?source=bookmark'), [
      '/team/growth?source=bookmark',
    ]);
  });

  it('repository_and_api_paths_not_route_consumers', () => {
    assert.deepEqual(extractConsumerRouteLiterals([
      'src/modules/team',
      'src/app/(auth)/team/page.tsx',
      'src/app/(auth)/workspace/[...path]/page.tsx',
      '/api/v1/team',
      'docs/team-plan.md',
    ].join(' ')), []);
  });

  it('dynamic_api_template_literal_normalized', () => {
    assert.equal(
      normalizeRuntimeRouteLiteral('/api/v1/member/${memberId}/approve?source=queue'),
      '/api/v1/member/:id/approve',
    );
    assert.equal(
      normalizeRuntimeRouteLiteral('/api/v1/admin/users/${user.id}'),
      '/api/v1/admin/users/:id',
    );
  });

  it('dynamic_api_template_literal_consumers_discovered', () => {
    assert.ok(baseObservations.apiConsumersByRoute['/api/v1/member/:id/approve'].includes(
      'src/modules/member/components/MemberApprovalQueue.tsx',
    ));
    assert.ok(baseObservations.apiConsumersByRoute['/api/v1/admin/users/:id'].includes(
      'src/modules/admin/components/EditUserDialog.tsx',
    ));
  });
});
