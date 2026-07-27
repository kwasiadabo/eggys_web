import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api, { resolveAssetUrl } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { money } from '../lib/format';
import CartFab from '../components/CartFab';
import EggPlaceholder from '../components/farm/EggPlaceholder';
import QuantityStepper from '../components/QuantityStepper';

const EGG_TYPE_LABELS = { chicken: 'Chicken', duck: 'Duck', quail: 'Quail', guinea_fowl: 'Guinea Fowl', turkey: 'Turkey' };
const FARMING_LABELS = { free_range: 'Free Range', organic: 'Organic', caged: 'Caged', pasture_raised: 'Pasture Raised' };

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => {});
    setQty(1);
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) return toast('Sign in to save favourites', 'info');
    try {
      if (favorited) {
        await api.delete(`/favorites/${id}`);
        setFavorited(false);
      } else {
        await api.post('/favorites', { productId: id });
        setFavorited(true);
      }
    } catch { /* ignore */ }
  };

  if (!product) return <p className="text-center py-20 text-black/40">Loading…</p>;

  const stock = product.Inventory?.quantityInStock ?? 0;
  const inStock = stock > 0;
  const specs = [
    ['Egg Type', EGG_TYPE_LABELS[product.eggType]],
    ['Grade', product.gradeSize?.replace(/_/g, ' ')],
    ['Farming Method', FARMING_LABELS[product.farmingMethod]],
  ].filter(([, v]) => v);

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12 grid md:grid-cols-2 gap-12">
      <div className="aspect-square bg-white border border-black/5 rounded-lg flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={resolveAssetUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <EggPlaceholder size={72} />
        )}
      </div>
      <div>
        <h1 className="font-display text-4xl">{product.name}</h1>
        <p className="text-sm text-black/40 mt-1">
          {product.packSize && `${product.packSize}-pack · `}{EGG_TYPE_LABELS[product.eggType]}
        </p>
        <p className="text-2xl mt-4">GHS {money(product.price)}</p>
        <p className="mt-4 text-black/70 leading-relaxed">{product.description}</p>

        {specs.length > 0 && (
          <div className="mt-6 space-y-1">
            {specs.map(([label, value]) => (
              <p key={label} className="text-sm">
                <span className="text-green uppercase text-xs tracking-widest mr-2">{label}</span>
                {value}
              </p>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {inStock && <QuantityStepper value={qty} onChange={setQty} max={stock} />}
          <button
            onClick={() => {
              addItem(product, qty);
              toast(`${qty} × ${product.name} added to cart`);
              setQty(1);
            }}
            disabled={!inStock}
            className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-green transition-colors disabled:opacity-30"
          >
            {inStock ? 'Add to Cart' : 'Sold Out'}
          </button>
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1.5 px-6 py-3 rounded-full border text-sm transition-colors ${
              favorited ? 'border-green text-green' : 'border-black/20 hover:border-black'
            }`}
          >
            <Heart size={16} strokeWidth={2} fill={favorited ? 'currentColor' : 'none'} />
            {favorited ? 'Saved' : 'Favourite'}
          </button>
        </div>
      </div>

      <CartFab />
    </div>
  );
}
