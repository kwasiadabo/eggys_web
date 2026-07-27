import { useEffect, useState } from 'react';
import { Egg } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import CartFab from '../components/CartFab';

const PAGE_SIZE = 24;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eggType, setEggType] = useState('');
  const [loading, setLoading] = useState(true);

  // reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, eggType]);

  useEffect(() => {
    setLoading(true);
    const params = { page, pageSize: PAGE_SIZE };
    if (search) params.search = search;
    if (eggType) params.eggType = eggType;
    const timer = setTimeout(() => {
      api.get('/products', { params })
        .then((res) => {
          setTotal(res.data.total);
          setProducts((prev) => (page === 1 ? res.data.products : [...prev, ...res.data.products]));
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, eggType, page]);

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl">The Collection</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-green"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Egg type
          <select
            value={eggType}
            onChange={(e) => setEggType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
          >
            <option value="">All types</option>
            <option value="chicken">Chicken</option>
            <option value="duck">Duck</option>
            <option value="quail">Quail</option>
            <option value="guinea_fowl">Guinea Fowl</option>
            <option value="turkey">Turkey</option>
          </select>
        </label>
        {total > 0 && (
          <span className="text-sm text-black/40 sm:pb-2">
            Showing {products.length} of {total} products
          </span>
        )}
      </div>

      {loading && page === 1 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-black/40">
          <Egg size={22} strokeWidth={1.5} className="animate-pulse" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : products.length ? (
        <>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {products.length < total && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setPage(page + 1)}
                disabled={loading}
                className="px-8 py-3 rounded-full border border-black/20 text-sm hover:border-green hover:text-green transition-colors disabled:opacity-40"
              >
                {loading ? 'Loading…' : `Load more (${total - products.length} remaining)`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2 text-black/40">
          <Egg size={22} strokeWidth={1.5} />
          <p className="text-sm">No products found.</p>
        </div>
      )}

      <CartFab />
    </div>
  );
}
