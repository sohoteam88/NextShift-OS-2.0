import { createBrowserClient } from '@supabase/ssr';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadFunnelImage(
  file: File,
  tenantId: string,
  funnelId: string,
): Promise<string> {
  if (file.size > MAX_SIZE) throw new Error('图片不能超过 5MB');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('只支持 JPG、PNG、WebP 格式');

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `funnel/${tenantId}/${funnelId}/${Date.now()}.${ext}`;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.storage.from('public').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`上传失败: ${error.message}`);

  const { data } = supabase.storage.from('public').getPublicUrl(path);
  return data.publicUrl;
}
