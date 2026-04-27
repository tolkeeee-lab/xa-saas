'use client';

import { useState, useCallback } from 'react';

export type RetraitItem = {
  em: string;
  nm: string;
  qty: number;
  pr: number;
};

export type RetraitCommande = {
  code: string;
  client: string;
  phone: string;
  ref: string;
  boutique: string;
  paye: boolean;
  mode: string;
  date: string;
  expire: string;
  items: RetraitItem[];
};

type RetraitResult = 'idle' | 'ok' | 'err';

export function useRetrait(codesRetrait: RetraitCommande[]) {
  const [code, setCode] = useState('');
  const [retraitResult, setRetraitResult] = useState<RetraitResult>('idle');
  const [retraitData, setRetraitData] = useState<RetraitCommande | null>(null);

  const validate = useCallback(() => {
    const found = codesRetrait.find((c) => c.code === code.trim());
    if (found) {
      setRetraitData(found);
      setRetraitResult('ok');
    } else {
      setRetraitData(null);
      setRetraitResult('err');
    }
  }, [code, codesRetrait]);

  return { code, setCode, retraitResult, retraitData, validate };
}
