'use client';

import { useEffect, useRef } from 'react';
import { KeyRound } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
  error?: string | null;
};

export default function CodeInput({ value, onChange, loading, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(raw);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
  }

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <div className="flex items-center gap-2 text-xa-muted mb-1">
        <KeyRound size={18} />
        <span className="text-sm">Saisir le code de retrait</span>
      </div>

      <div className="relative w-full max-w-xs">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={loading}
          placeholder="000000"
          className={`w-full rounded-2xl border-2 bg-xa-bg text-xa-text text-center text-4xl font-bold tracking-[0.4em] px-4 py-4 outline-none transition-colors disabled:opacity-50 ${
            error
              ? 'border-red-400 focus:border-red-500'
              : value.length === 6
                ? 'border-xa-primary'
                : 'border-xa-border focus:border-xa-primary'
          }`}
          aria-label="Code de retrait 6 chiffres"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xa-muted text-sm animate-pulse">
            …
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center max-w-xs">{error}</p>
      )}

      {!error && value.length === 0 && (
        <p className="text-xa-muted text-xs text-center">
          Le client reçoit ce code après paiement
        </p>
      )}
    </div>
  );
}
