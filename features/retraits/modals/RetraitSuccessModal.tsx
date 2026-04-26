'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

type Props = {
  clientNom: string;
  total: number;
  onDismiss: () => void;
};

export default function RetraitSuccessModal({ clientNom, total, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-500 text-white"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Retrait validé"
    >
      <CheckCircle size={80} strokeWidth={1.5} className="mb-6 animate-bounce" />
      <h1 className="text-3xl font-bold mb-2">Retrait validé !</h1>
      <p className="text-lg opacity-90 mb-1">{clientNom}</p>
      <p className="text-2xl font-bold">{total.toLocaleString('fr-FR')} FCFA</p>
      <p className="mt-8 text-sm opacity-70">Appuyez pour continuer</p>
    </div>
  );
}
