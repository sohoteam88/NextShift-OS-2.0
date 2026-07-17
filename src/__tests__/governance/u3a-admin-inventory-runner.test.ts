import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const baseline = '76636360d8c1a643c86bb26eb8923c6271241679';

function ensureAuthorizedBaselineCommit(): void {
  try {
    execFileSync('git', ['cat-file', '-e', `${baseline}^{commit}`], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', baseline], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    execFileSync('git', ['cat-file', '-e', `${baseline}^{commit}`], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
}

describe('U3A admin-space frozen inventory', () => {
  it('runs all 55 frozen inventory contract fixtures in the default test suite', () => {
    ensureAuthorizedBaselineCommit();
    const output = execFileSync(
      process.execPath,
      ['--import', 'tsx', '--test', 'scripts/u3a-admin-inventory/validator.test.ts'],
      { cwd: repoRoot, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
    );

    expect(output).toContain('tests 55');
    expect(output).toContain('pass 55');
    expect(output).toContain('fail 0');
  }, 180_000);
});
