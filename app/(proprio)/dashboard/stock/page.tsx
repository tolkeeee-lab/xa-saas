import { redirect } from 'next/navigation';

// Legacy route — kept as a permanent redirect to the new stock page.
// The old singular /dashboard/stock now forwards to /dashboard/stocks (v4).
export default function StockLegacyRedirect() {
  redirect('/dashboard/stocks');
}
