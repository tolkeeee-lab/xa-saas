import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('boutiques')
    .select('id, nom, code_unique')
    .eq('code_unique', code.toUpperCase())
    .eq('actif', true)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
  return NextResponse.json(data);
}
