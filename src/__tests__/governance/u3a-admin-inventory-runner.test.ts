import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const frozenEvidenceHead = '0678327511f218c78213829d12371817d9b06f63';
const authorizedBaseline = '76636360d8c1a643c86bb26eb8923c6271241679';

function ensureGitObject(object: string, fetchRef: string): void {
  try {
    execFileSync('git', ['cat-file', '-e', object], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', fetchRef], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    execFileSync('git', ['cat-file', '-e', object], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
}

describe('U3A admin-space frozen inventory', () => {
  it('runs all 55 frozen inventory contract fixtures in the default test suite', () => {
    ensureGitObject(`${frozenEvidenceHead}^{commit}`, frozenEvidenceHead);
    // A shallow CI checkout may contain the baseline commit object without all
    // path/tree objects needed by the frozen validator. Verify a known frozen
    // source blob, and deepen that exact commit only when it is unavailable.
    ensureGitObject(`${authorizedBaseline}:src/app/(auth)/admin/page.tsx`, authorizedBaseline);
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'nextshift-u3a-frozen-'));
    const frozenRoot = resolve(fixtureRoot, 'tree');
    try {
      execFileSync('git', ['worktree', 'add', '--detach', frozenRoot, frozenEvidenceHead], {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const output = execFileSync(
        process.execPath,
        ['--import', 'tsx', '--test', 'scripts/u3a-admin-inventory/validator.test.ts'],
        {
          cwd: repoRoot,
          encoding: 'utf8',
          env: { ...process.env, U3A_FROZEN_ROOT: frozenRoot },
          maxBuffer: 4 * 1024 * 1024,
        },
      );

      expect(output).toContain('tests 55');
      expect(output).toContain('pass 55');
      expect(output).toContain('fail 0');
    } finally {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', frozenRoot], {
          cwd: repoRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } finally {
        rmSync(fixtureRoot, { recursive: true, force: true });
      }
    }
  }, 180_000);
});
