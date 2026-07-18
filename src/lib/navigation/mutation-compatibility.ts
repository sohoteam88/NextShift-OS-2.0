import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';

function routeMatches(pathname: string, template: string): boolean {
  const actual = pathname.split('/').filter(Boolean);
  const expected = template.split('/').filter(Boolean);
  return actual.length === expected.length && expected.every((part, index) =>
    part.startsWith(':') ? actual[index].length > 0 : actual[index] === part
  );
}

/** Call only after authentication and role authorization. */
export function requireCanonicalMutationPath(request: NextRequest, canonicalTemplate: string): void {
  if (!routeMatches(request.nextUrl.pathname, canonicalTemplate)) {
    throw new AppError('LEGACY_MUTATION_GONE', 410, 'Legacy mutation endpoint is no longer active');
  }
}
