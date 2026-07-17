import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('U3A admin-space frozen inventory', () => {
  it('runs all 55 frozen inventory contract fixtures in the default test suite', () => {
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
