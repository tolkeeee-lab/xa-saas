import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPinServer } from '@/lib/pinHash';

interface VerifyPinBody {
  boutique_id: string;
  pin: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as VerifyPinBody;
  const { boutique_id, pin } = body;

  if (!boutique_id || !pin) {
    return NextResponse.json({ ok: false, error: 'Paramètres manquants' }, { status: 400 });
  }

  // Vérifier PIN caisse boutique
  const { data: boutique } = await supabaseAdmin
    .from('boutiques')
    .select('pin_caisse')
    .eq('id', boutique_id)
    .single();

  if (boutique?.pin_caisse === pin) {
    return NextResponse.json({ ok: true, employe: null });
  }

  // Vérifier PIN employé (le PIN est déjà hashé côté client)
  const { data: employes } = await supabaseAdmin
    .from('employes')
    .select('id, nom, prenom, pin')
    .eq('boutique_id', boutique_id)
    .eq('actif', true);

  for (const emp of employes ?? []) {
    if (emp.pin === pin) {
      return NextResponse.json({
        ok: true,
        employe: { id: emp.id, nom: [emp.nom, emp.prenom].filter(Boolean).join(' ') },
      });
    }
    // Vérification secondaire : hash server-side au cas où le PIN serait stocké en clair (transition)
    if (emp.pin && emp.pin.length < 64 && hashPinServer(emp.pin) === pin) {
      return NextResponse.json({
        ok: true,
        employe: { id: emp.id, nom: [emp.nom, emp.prenom].filter(Boolean).join(' ') },
      });
    }
  }

  return NextResponse.json({ ok: false, error: 'PIN incorrect' }, { status: 401 });
}
