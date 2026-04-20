import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/rateLimit';
import { validateBody } from '@/lib/schemas/validate';
import { venteV3Schema } from '@/lib/schemas/vente-v3';
import { revalidateUserCache } from '@/lib/revalidate';

// ─── Validation schema ────────────────────────────────────────────────────────

// Schema defined in lib/schemas/vente-v3.ts

// ─── POST /api/caisse/vente ───────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  const limited = await applyRateLimit(request);
  if (limited) return limited;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { data: body, error: validationError } = validateBody(venteV3Schema, rawBody);
  if (validationError) return validationError;

  const supabase = createAdminClient();

  // ── Resolve produit details (prix_achat, nom, stock) ─────────────────────────
  const produitIds = body.lignes.map((l) => l.produit_id);

  const { data: produitsData, error: produitsError } = await supabase
    .from('produits')
    .select('id, nom, prix_achat, stock_actuel')
    .in('id', produitIds);

  if (produitsError) {
    return NextResponse.json({ error: produitsError.message }, { status: 500 });
  }

  const produitMap = new Map(
    (produitsData ?? []).map((p) => [p.id, p]),
  );

  // Stock validation (also done atomically in the RPC, but fail-fast here too)
  for (const ligne of body.lignes) {
    const produit = produitMap.get(ligne.produit_id);
    if (!produit) {
      return NextResponse.json(
        { error: `Produit introuvable: ${ligne.produit_id}` },
        { status: 422 },
      );
    }
    if (produit.stock_actuel < ligne.quantite) {
      return NextResponse.json(
        { error: `Stock insuffisant pour "${produit.nom}"` },
        { status: 422 },
      );
    }
  }

  const benefice_total = body.lignes.reduce((sum, ligne) => {
    const p = produitMap.get(ligne.produit_id);
    const marge = p ? ligne.prix_unitaire - p.prix_achat : 0;
    return sum + marge * ligne.quantite;
  }, 0);

  // ── Build lignes JSONB payload for the RPC ────────────────────────────────────
  const lignesPayload = body.lignes.map((ligne) => ({
    produit_id: ligne.produit_id,
    quantite: ligne.quantite,
    prix_unitaire: ligne.prix_unitaire,
    nom_produit: produitMap.get(ligne.produit_id)?.nom ?? 'Produit',
    prix_achat: produitMap.get(ligne.produit_id)?.prix_achat ?? 0,
  }));

  // ── Call process_sale_v2 RPC ──────────────────────────────────────────────────
  const { data: rpcResult, error: rpcError } = await supabase.rpc('process_sale_v2', {
    p_boutique_id:      body.boutique_id,
    p_lignes:           lignesPayload,
    p_montant_total:    body.montant_total,
    p_benefice_total:   benefice_total,
    p_mode_paiement:    body.mode_paiement,
    p_remise_pct:       body.remise_pct ?? 0,
    p_montant_recu:     body.montant_recu ?? null,
    p_monnaie_rendue:   body.monnaie_rendue ?? null,
    p_client_id:        body.client_id ?? null,
    p_client_nom:       body.client_nom ?? null,
    p_client_telephone: body.client_telephone ?? null,
    p_local_id:         body.local_id ?? null,
    p_employe_id:       body.employe_id ?? null,
  });

  if (rpcError) {
    // Surface user-friendly stock/not-found errors from the RPC
    const msg = rpcError.message ?? 'Erreur lors de la validation de la vente';
    const status = msg.includes('Stock insuffisant') || msg.includes('introuvable') ? 422 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const rpc = rpcResult as { transaction_id: string; duplicate: boolean; numero_facture: string } | null;

  if (!rpc) {
    return NextResponse.json({ error: 'Réponse RPC invalide' }, { status: 500 });
  }

  // ── Fetch created_at and line details ─────────────────────────────────────────
  const { data: txData } = await supabase
    .from('transactions')
    .select('id, created_at')
    .eq('id', rpc.transaction_id)
    .single();

  const ticketLignes = body.lignes.map((l) => ({
    produit_id: l.produit_id,
    nom: produitMap.get(l.produit_id)?.nom ?? 'Produit',
    quantite: l.quantite,
    prix_unitaire: l.prix_unitaire,
    sous_total: l.prix_unitaire * l.quantite,
  }));

  // ── Invalidate caches ─────────────────────────────────────────────────────────
  // We don't have a userId here (caisse routes are public), but we can revalidate
  // using the boutique owner. Look it up from the boutique row.
  const { data: boutiqueRow } = await supabase
    .from('boutiques')
    .select('proprietaire_id')
    .eq('id', body.boutique_id)
    .single();

  if (boutiqueRow?.proprietaire_id) {
    const cacheTags = ['alertes-stock', 'notifications', 'stocks-consolides', 'weekly-stats', 'rapports'];
    if (body.mode_paiement === 'credit') cacheTags.push('dettes');
    revalidateUserCache(boutiqueRow.proprietaire_id, cacheTags);
  }

  return NextResponse.json({
    transaction_id:  rpc.transaction_id,
    numero_facture:  rpc.numero_facture,
    duplicate:       rpc.duplicate,
    created_at:      txData?.created_at ?? new Date().toISOString(),
    lignes:          ticketLignes,
    montant_total:   body.montant_total,
    remise_pct:      body.remise_pct ?? 0,
    mode_paiement:   body.mode_paiement,
  });
}
