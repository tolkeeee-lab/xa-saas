import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'code_unique requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('boutiques')
    .select('id, nom')
    .eq('code_unique', code)
    .eq('actif', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  }

  return NextResponse.json(data);
}
