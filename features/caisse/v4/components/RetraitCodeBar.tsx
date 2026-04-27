'use client';

import { Package } from 'lucide-react';

interface RetraitCodeBarProps {
  code: string;
  onCodeChange: (v: string) => void;
  onValidate: () => void;
  result: 'idle' | 'ok' | 'err';
  resultMessage: string;
  pendingCodes?: string[];
}

export default function RetraitCodeBar({
  code,
  onCodeChange,
  onValidate,
  result,
  resultMessage,
  pendingCodes,
}: RetraitCodeBarProps) {
  return (
    <>
      <div className="v4-retrait-bar">
        <span className="v4-retrait-icon">
          <Package size={13} />
        </span>
        <input
          className="v4-retrait-input"
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="CODE"
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            onCodeChange(val);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onValidate();
          }}
          aria-label="Code de retrait à 4 chiffres"
        />
        <button
          type="button"
          className="v4-retrait-validate"
          onClick={onValidate}
          aria-label="Valider le code retrait"
          style={{ minHeight: 44 }}
        >
          Valider
        </button>
        {pendingCodes && pendingCodes.length > 0 && (
          <span className="v4-retrait-hint">
            En attente :{' '}
            {pendingCodes.map((c) => (
              <b
                key={c}
                onClick={() => onCodeChange(c)}
                style={{ cursor: 'pointer' }}
              >
                {c}
              </b>
            ))}
          </span>
        )}
      </div>
      {result !== 'idle' && (
        <div className={`v4-retrait-result ${result}`}>{resultMessage}</div>
      )}
    </>
  );
}
