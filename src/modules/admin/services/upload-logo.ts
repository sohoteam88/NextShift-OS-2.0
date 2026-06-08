import { createBrowserClient } from '@supabase/ssr';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export async function uploadTenantLogo(file: File, tenantId: string): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('Logo must be smaller than 5MB');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format');
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const path = `tenant/${tenantId}/logo/${Date.now()}.${ext}`;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.storage.from('public').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('public').getPublicUrl(path);
  return data.publicUrl;
}
