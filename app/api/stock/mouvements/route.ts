import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import { applyRateLimit } from '@/lib/rateLimit';
import type { MouvementStockType, MouvementStockMotif } from '@/types/database';

type MouvementBody = {
  produit_id: string;
  boutique_id: string;
  type: MouvementStockType;
  motif?: MouvementStockMotif;
  quantite: number;
  note?: string;
};

function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v);
}

const VALID_TYPES: MouvementStockType[] = [
  'reception', 'sortie', 'ajustement', 'transfert_out', 'transfert_in', 'inventaire',
];

const VALID_MOTIFS: MouvementStockMotif[] = [
  'livraison_fournisseur', 'livraison_mafro', 'vendu_caisse', 'vendu_hors_caisse',
  'casse', 'perte', 'vol', 'peremption', 'transfert', 'inventaire', 'autre',
];

/**
 * POST /api/stock/mouvements
 * Enregistre un mouvement de stock (réception, sortie, ajustement).
 * Le trigger DB met à jour produits.stock_actuel automatiquement.
 */
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  const role = await getEffectiveRole();
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  // Validate required fields
  if (!isValidUUID(b.produit_id)) return NextResponse.json({ error: 'produit_id invalide' }, { status: 400 });
  if (!isValidUUID(b.boutique_id)) return NextResponse.json({ error: 'boutique_id invalide' }, { status: 400 });
  if (!VALID_TYPES.includes(b.type as MouvementStockType)) {
    return NextResponse.json({ error: 'type invalide' }, { status: 400 });
  }
  const quantite = Number(b.quantite);
  if (isNaN(quantite) || quantite <= 0) {
    return NextResponse.json({ error: 'quantite doit être > 0' }, { status: 400 });
  }
  const motif = typeof b.motif === 'string' && VALID_MOTIFS.includes(b.motif as MouvementStockMotif)
    ? (b.motif as MouvementStockMotif)
    : null;
  const note = typeof b.note === 'string' ? b.note.trim() || null : null;

  const parsed: MouvementBody = {
    produit_id: b.produit_id as string,
    boutique_id: b.boutique_id as string,
    type: b.type as MouvementStockType,
    motif: motif ?? undefined,
    quantite,
    note: note ?? undefined,
  };

  const admin = createAdminClient();

  // ── Auth / ownership check ──────────────────────────────────────────────────
  if (role.role !== 'admin') {
    const { data: boutique } = await admin
      .from('boutiques')
      .select('id, proprietaire_id')
      .eq('id', parsed.boutique_id)
      .maybeSingle();

    if (!boutique) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });

    const isOwner = boutique.proprietaire_id === role.userId;
    const isEmployee = role.boutiqueIdAssignee === parsed.boutique_id;

    if (!isOwner && !isEmployee) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
  }

  // ── Read current stock (SELECT ... FOR UPDATE via RPC not available; use optimistic read) ──
  const { data: produit, error: fetchErr } = await admin
    .from('produits')
    .select('stock_actuel')
    .eq('id', parsed.produit_id)
    .single();

  if (fetchErr || !produit) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
  }

  const stock_avant = produit.stock_actuel;

  // ── Compute stock_apres ────────────────────────────────────────────────────
  let stock_apres: number;
  if (parsed.type === 'ajustement' || parsed.type === 'inventaire') {
    // For adjustments, quantite IS the target stock
    stock_apres = quantite;
  } else if (parsed.type === 'reception' || parsed.type === 'transfert_in') {
    stock_apres = stock_avant + quantite;
  } else {
    stock_apres = stock_avant - quantite;
  }

  // ── Guard: no negative stock for sorties ──────────────────────────────────
  if ((parsed.type === 'sortie' || parsed.type === 'transfert_out') && stock_apres < 0) {
    return NextResponse.json(
      { error: 'Stock insuffisant — le stock ne peut pas être négatif.' },
      { status: 400 },
    );
  }

  // ── Insert mouvement (trigger handles produits.stock_actuel update) ────────
  const { data: mouvement, error: insertErr } = await admin
    .from('mouvements_stock')
    .insert({
      produit_id: parsed.produit_id,
      boutique_id: parsed.boutique_id,
      type: parsed.type,
      motif: parsed.motif ?? null,
      quantite,
      stock_avant,
      stock_apres,
      note: parsed.note ?? null,
      created_by: role.userId,
    })
    .select('*')
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mouvement, stock_apres }, { status: 201 });
}
