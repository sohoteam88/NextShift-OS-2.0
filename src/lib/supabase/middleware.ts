import { createClient } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  void req;
  void res;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}
