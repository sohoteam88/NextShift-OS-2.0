import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/env';

export function createBrowserSupabaseClient() {
  const { url, key } = getSupabasePublicConfig();

  return createBrowserClient(url, key);
}
