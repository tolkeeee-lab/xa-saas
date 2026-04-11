import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processSale } from '@/lib/supabase/processSale';
import type { TransactionInsert, TransactionLigneInsert } from '@/types/database';

interface TransactionBody {
  transaction: TransactionInsert;
  lignes: TransactionLigneInsert[];
}

export async function POST(request: NextRequest) {
  const body = await request.json() as TransactionBody;
  const { transaction, lignes } = body;

  if (!transaction || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  try {
    const result = await processSale(transaction, lignes);
    return NextResponse.json({ ok: true, transactionId: result.transactionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
