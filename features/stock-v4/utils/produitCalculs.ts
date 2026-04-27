export function calcPrixUnitaireAchat(prixLot: number, qtyParLot: number): number {
  if (!qtyParLot || qtyParLot <= 0) return 0;
  return Math.round((prixLot / qtyParLot) * 100) / 100;
}

export function calcMarge(prixVente: number, prixAchatUnit: number) {
  const montant = prixVente - prixAchatUnit;
  const pct = prixAchatUnit > 0 ? (montant / prixAchatUnit) * 100 : 0;
  let level: 'ok' | 'warn' | 'bad' | 'neg' = 'ok';
  if (montant < 0) level = 'neg';
  else if (pct < 10) level = 'bad';
  else if (pct < 20) level = 'warn';
  return { montant, pct, level };
}

export function suggestLotLabel(categorie: string): string {
  const c = (categorie || '').toLowerCase();
  if (c.includes('boisson')) return 'carton';
  if (c.includes('huile')) return 'bidon';
  if (c.includes('hygiène') || c.includes('hygiene')) return 'carton';
  if (c.includes('céréale') || c.includes('cereale')) return 'sac';
  return 'carton';
}

export function suggestUniteLabel(lotLabel: string, categorie: string): string {
  const c = (categorie || '').toLowerCase();
  if (c.includes('boisson')) return 'bouteille';
  if (c.includes('huile')) return 'litre';
  return 'pièce';
}

export function decompose(stock: number, qtyParLot: number) {
  if (!qtyParLot || qtyParLot <= 0) return null;
  const lots = Math.floor(stock / qtyParLot);
  const reste = stock % qtyParLot;
  return { lots, reste };
}
