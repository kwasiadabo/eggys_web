import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// A type-to-filter dropdown for option lists too long to scan by eye (rider
// assignment, etc.) — same value/onChange contract as a native <select>.
export default function SearchableSelect({
  options, // [{ value, label }]
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  triggerClassName = 'w-full px-4 py-2 rounded-full border border-black/15 bg-white text-sm',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const select = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-2 text-left focus:outline-none focus:border-green disabled:opacity-40 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className={`truncate ${selected ? '' : 'text-black/40'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-black/40" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-48 rounded-lg border border-black/10 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5">
            <Search size={13} strokeWidth={2} className="text-black/30 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder={searchPlaceholder}
              className="w-full text-sm focus:outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length ? (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => select(opt)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors ${
                      opt.value === value ? 'text-green font-medium' : ''
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-black/40">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
