import { Egg } from 'lucide-react';

// Fallback artwork shown when a product has no photo yet.
export default function EggPlaceholder({ size = 40 }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-green-light/25 to-green/15">
      <Egg size={size} strokeWidth={1.25} className="text-green" />
    </div>
  );
}
