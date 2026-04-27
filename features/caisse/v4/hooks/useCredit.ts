'use client';

import { useState, useCallback, useMemo } from 'react';

export function useCredit(total: number) {
  const [verseRaw, setVerseRaw] = useState('');

  const verse = useMemo(() => {
    const n = parseInt(verseRaw || '0', 10);
    return isNaN(n) ? 0 : n;
  }, [verseRaw]);

  const solde = useMemo(() => {
    return Math.max(0, total - verse);
  }, [total, verse]);

  const pressKey = useCallback((digit: string) => {
    setVerseRaw((prev) => {
      if (prev.length >= 9) return prev;
      // Prevent starting with a lone '0'
      if (prev === '' && digit === '0') return prev;
      const next = prev + digit;
      // Strip leading zeros, keeping the remaining digits
      const stripped = next.replace(/^0+/, '');
      return stripped;
    });
  }, []);

  const deleteLast = useCallback(() => {
    setVerseRaw((prev) => prev.slice(0, -1));
  }, []);

  const reset = useCallback(() => {
    setVerseRaw('');
  }, []);

  return { verseRaw, verse, solde, pressKey, deleteLast, reset };
}
