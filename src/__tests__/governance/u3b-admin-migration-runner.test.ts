import { describe, expect, it } from 'vitest';
import { buildCompletionMatrix, U3BValidationError, validateCompletionMatrix } from '../../../scripts/u3b-admin-migration/validator';

const root = process.cwd();

function expectRejected(mutator: (matrix: any) => void, message: RegExp) {
  const matrix = structuredClone(buildCompletionMatrix(root));
  mutator(matrix);
  expect(() => validateCompletionMatrix(root, matrix)).toThrowError(message);
}

describe('U3B current-tree transition contract', () => {
  it('complete_frozen_transition_map_passes', () => {
    const report = validateCompletionMatrix(root);
    expect(report.assertions).toBeGreaterThanOrEqual(19);
  });

  it('new_privileged_source_rejected', () => expectRejected((matrix) => {
    matrix.expected_counts.privileged_pages += 1;
  }, /privileged_pages/));

  it('new_privileged_method_rejected', () => expectRejected((matrix) => {
    matrix.expected_counts.exported_methods += 1;
  }, /exported_methods/));

  it('missing_caller_migration_rejected', () => expectRejected((matrix) => {
    matrix.consumer_rows[0].status = 'incomplete';
  }, /runtime legacy callers remain/));

  it('wrong_guard_rejected', () => expectRejected((matrix) => {
    matrix.page_rows[0].status = 'incomplete';
  }, /pages incomplete/));

  it('wrong_target_rejected', () => expectRejected((matrix) => {
    matrix.api_method_rows[0].status = 'incomplete';
  }, /methods incomplete/));

  it('redirect_chain_rejected', () => expectRejected((matrix) => {
    matrix.compatibility_route_rows[0].status = 'blocked';
  }, /redirects incomplete/));

  it('superadmin_audit_gap_rejected', () => expectRejected((matrix) => {
    const target = matrix.target_write_rows.find((row: any) => row.target_namespace === 'superadmin');
    target.success_failure_audit_present = false;
  }, /superadmin_success_failure_audits/));

  it('missing_security_authority_rejected', () => expectRejected((matrix) => {
    matrix.security_authority_rows[0].status = 'incomplete';
  }, /security incomplete/));
});
