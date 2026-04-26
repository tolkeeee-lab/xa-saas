'use client';

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function CashCountInput({ value, onChange, disabled }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw);
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-2">
      <label className="text-sm font-medium text-xa-text" htmlFor="cash-count-input">
        Cash compté en caisse
      </label>
      <div className="relative flex items-center">
        <input
          id="cash-count-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0"
          className="w-full rounded-2xl border-2 border-xa-border bg-xa-bg text-xa-text text-3xl font-bold text-right pr-20 pl-4 py-4 focus:outline-none focus:border-xa-primary transition-colors disabled:opacity-50"
        />
        <span className="absolute right-4 text-xa-muted text-base font-medium pointer-events-none">
          FCFA
        </span>
      </div>
    </div>
  );
}
