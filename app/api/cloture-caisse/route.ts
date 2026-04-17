import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { clotureCaissePostSchema } from '@/lib/schemas/cloture-caisse';
import { revalidateUserCache } from '@/lib/revalidate';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type ParMode = Record<string, number>;

/**
 * Compute ca_theorique, cash_theorique, par_mode, and nb_transactions
 * from the transactions table for a given boutique and date.
 */
async function computeTheorique(boutiqueId: string, date: string) {
  const admin = createAdminClient();
  const startISO = `${date}T00:00:00.000Z`;
  const endISO = `${date}T23:59:59.999Z`;

  const { data: txs } = await admin
    .from('transactions')
    .select('montant_total, mode_paiement')
    .eq('boutique_id', boutiqueId)
    .eq('statut', 'validee')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  const rows = txs ?? [];
  const nb_transactions = rows.length;
  const ca_theorique = rows.reduce((s, t) => s + (t.montant_total ?? 0), 0);

  const par_mode: ParMode = {};
  for (const t of rows) {
    const mode = t.mode_paiement ?? 'autre';
    par_mode[mode] = (par_mode[mode] ?? 0) + (t.montant_total ?? 0);
  }

  const cash_theorique = par_mode['especes'] ?? 0;

  return { ca_theorique, cash_theorique, par_mode, nb_transactions };
}

/**
 * GET /api/cloture-caisse?boutique_id=X&date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const boutique_id = searchParams.get('boutique_id');
  const date = searchParams.get('date');

  if (!boutique_id || !date) {
    return NextResponse.json(
      { error: 'Paramètres boutique_id et date requis' },
      { status: 400 },
    );
  }

  if (!ISO_DATE_RE.test(date)) {
    return NextResponse.json(
      { error: 'Format de date invalide (YYYY-MM-DD attendu)' },
      { status: 400 },
    );
  }

  const { ca_theorique, cash_theorique, par_mode, nb_transactions } = await computeTheorique(
    boutique_id,
    date,
  );

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('clotures_caisse')
    .select('id, cash_reel, ecart, note')
    .eq('boutique_id', boutique_id)
    .eq('date', date)
    .maybeSingle();

  return NextResponse.json({
    ca_theorique,
    cash_theorique,
    par_mode,
    nb_transactions,
    cloture_existante: existing ?? null,
  });
}

/**
 * POST /api/cloture-caisse
 * Body: { boutique_id, date, cash_reel, note? }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(clotureCaissePostSchema, rawBody);
  if (validationError) return validationError;

  const { boutique_id, date, cash_reel, note } = body;

  const { ca_theorique, cash_theorique, par_mode, nb_transactions } = await computeTheorique(
    boutique_id,
    date,
  );

  const admin = createAdminClient();

  const { data: cloture, error } = await admin
    .from('clotures_caisse')
    .upsert(
      {
        boutique_id,
        proprietaire_id: user.id,
        date,
        ca_theorique,
        cash_theorique,
        cash_reel,
        nb_transactions,
        par_mode,
        note: note ?? null,
      },
      { onConflict: 'boutique_id,date' },
    )
    .select('id, ecart')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateUserCache(user.id, ['cloture-caisse']);

  return NextResponse.json({ success: true, cloture: { id: cloture.id, ecart: cloture.ecart } });
}
