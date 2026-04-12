import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('boutiques')
    .select('*')
    .eq('id', id)
    .eq('actif', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  }

  return NextResponse.json(data);
}
