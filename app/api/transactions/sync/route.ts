import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processSale } from '@/lib/supabase/processSale';
import type { TransactionInsert, TransactionLigneInsert } from '@/types/database';

interface PendingTransactionBody {
  localId: string;
  transaction: TransactionInsert;
  lignes: TransactionLigneInsert[];
}

export async function POST(request: NextRequest) {
  const body = await request.json() as PendingTransactionBody;
  const { transaction, lignes } = body;

  if (!transaction || !lignes || !Array.isArray(lignes)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  // Marquer comme synced
  const txWithSync: TransactionInsert = {
    ...transaction,
    sync_statut: 'synced',
    synced_at: new Date().toISOString(),
  };

  try {
    const result = await processSale(txWithSync, lignes);
    return NextResponse.json({ ok: true, transactionId: result.transactionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
