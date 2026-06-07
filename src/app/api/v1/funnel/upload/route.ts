import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { AppError } from '@/lib/errors';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const funnelId = formData.get('funnel_id') as string | null;

  if (!file) throw new AppError('VALIDATION_ERROR', 400, 'No file provided');
  if (!funnelId) throw new AppError('VALIDATION_ERROR', 400, 'No funnel_id provided');
  if (file.size > MAX_SIZE) throw new AppError('VALIDATION_ERROR', 400, 'File too large (max 5MB)');
  if (!ALLOWED_TYPES.includes(file.type)) throw new AppError('VALIDATION_ERROR', 400, 'Invalid file type');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `funnel/${user.tenantId}/${funnelId}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from('public').upload(path, bytes, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new AppError('INTERNAL_ERROR', 500, `Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('public').getPublicUrl(path);
  return NextResponse.json({ data: { url: data.publicUrl } });
});
