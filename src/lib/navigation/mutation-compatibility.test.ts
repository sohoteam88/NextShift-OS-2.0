import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { requireCanonicalMutationPath } from './mutation-compatibility';

describe('legacy mutation compatibility', () => {
  it('allows the exact canonical path including parameter segments', () => {
    expect(() => requireCanonicalMutationPath(
      new NextRequest('https://example.test/api/v1/admin/users/user-1'),
      '/api/v1/admin/users/:id',
    )).not.toThrow();
  });

  it('fails closed with 410 instead of redirecting a legacy mutation', () => {
    expect(() => requireCanonicalMutationPath(
      new NextRequest('https://example.test/api/v1/platform-admin/users/user-1'),
      '/api/v1/superadmin/users/:id',
    )).toThrowError(expect.objectContaining({ code: 'LEGACY_MUTATION_GONE', statusCode: 410 }));
  });
});
