import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth/getAuthUser';

// NOTE: The Supabase Storage bucket "produits" must be created manually in the
// Supabase console with public read access before this endpoint can be used.

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthUser();
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Format non supporté (jpg, png, webp)' }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'Fichier trop lourd (max 2 Mo)' }, { status: 400 });

  const ext = file.type.split('/')[1];
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from('produits').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const {
    data: { publicUrl },
  } = supabase.storage.from('produits').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
