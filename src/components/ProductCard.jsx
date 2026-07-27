import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { money } from '../lib/format';
import { resolveAssetUrl } from '../lib/api';
import EggPlaceholder from './farm/EggPlaceholder';
import QuantityStepper from './QuantityStepper';

const EGG_TYPE_LABELS = { chicken: 'Chicken', duck: 'Duck', quail: 'Quail', guinea_fowl: 'Guinea Fowl', turkey: 'Turkey' };

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToastStore((s) => s.show);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const stock = product.Inventory?.quantityInStock ?? 0;
  const inStock = stock > 0;

  const handleAdd = () => {
    addItem(product, qty);
    toast(`${qty} × ${product.name} added to cart`);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white border border-black/5 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-gradient-to-b from-black/[0.03] to-black/[0.06] flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img src={resolveAssetUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <EggPlaceholder />
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs uppercase tracking-widest text-green">{product.Brand?.name}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display text-lg mt-1 leading-snug">{product.name}</h3>
        </Link>
        <p className="text-xs text-black/40 mt-0.5">
          {product.packSize ? `${product.packSize}-pack` : ''} {EGG_TYPE_LABELS[product.eggType] || ''}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-medium">GHS {money(product.price)}</span>
          {inStock && <QuantityStepper value={qty} onChange={setQty} max={stock} size="sm" />}
        </div>
        <button
          onClick={handleAdd}
          disabled={!inStock || added}
          className={`mt-2 w-full flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-full transition-colors disabled:cursor-not-allowed ${
            added
              ? 'bg-green-600 text-white'
              : 'bg-ink text-white hover:bg-green disabled:opacity-30'
          }`}
        >
          {added ? <>Added <Check size={13} strokeWidth={2.5} /></> : inStock ? 'Add to cart' : 'Sold out'}
        </button>
      </div>
    </div>
  );
}
