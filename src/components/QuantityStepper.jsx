import { Minus, Plus } from 'lucide-react';

const SIZES = {
  sm: { btn: 'h-8 w-8', text: 'w-6 text-xs' },
  md: { btn: 'h-11 w-11', text: 'w-8 text-sm' },
};

export default function QuantityStepper({ value, onChange, max, size = 'md' }) {
  const s = SIZES[size];
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(max != null ? Math.min(max, value + 1) : value + 1);

  return (
    <div className="inline-flex items-center rounded-full border border-black/15 shrink-0">
      <button
        type="button"
        onClick={dec}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className={`${s.btn} flex items-center justify-center text-black/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className={`${s.text} text-center font-medium tabular-nums`}>{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={max != null && value >= max}
        aria-label="Increase quantity"
        className={`${s.btn} flex items-center justify-center text-black/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
