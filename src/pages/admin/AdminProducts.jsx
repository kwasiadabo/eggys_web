import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { resolveAssetUrl } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { money } from '../../lib/format';

const emptyForm = {
  sku: '', name: '', description: '', price: '', packSize: '',
  eggType: 'chicken', farmingMethod: 'free_range', gradeSize: 'medium',
  imageUrl: '', quantityInStock: 0,
};

const EGG_TYPE_LABELS = { chicken: 'Chicken', duck: 'Duck', quail: 'Quail', guinea_fowl: 'Guinea Fowl', turkey: 'Turkey' };

// "Free-Range Chicken Eggs (12-pack)" + 12 -> "FREE-RANG-CHIC-12"
function generateSku(name, packSize) {
  const clean = (s) => s.replace(/[^a-z0-9 ]/gi, '').trim().split(/\s+/).filter(Boolean);
  const namePart = clean(name).map((w) => w.slice(0, 4).toUpperCase()).slice(0, 4).join('-');
  return [namePart, packSize || null].filter(Boolean).join('-');
}

export default function AdminProducts() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // product being edited, or null = add mode
  const [restockQty, setRestockQty] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [skuTouched, setSkuTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ search: '', eggType: '' });
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadProducts = () => {
    const params = { pageSize: 200 };
    if (filters.search) params.search = filters.search;
    if (filters.eggType) params.eggType = filters.eggType;
    api.get('/products', { params }).then((res) => {
      setProducts(res.data.products);
      setTotal(res.data.total);
    });
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const timer = setTimeout(loadProducts, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [user, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate the SKU while adding, unless the admin typed one manually
  useEffect(() => {
    if (editing || skuTouched || !form.name) return;
    setForm((f) => ({ ...f, sku: generateSku(f.name, f.packSize) }));
  }, [form.name, form.packSize, editing, skuTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.isAdmin) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setRestockQty('');
    setImageFile(null);
    setSkuTouched(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (product) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      packSize: product.packSize || '',
      eggType: product.eggType || 'chicken',
      farmingMethod: product.farmingMethod || 'free_range',
      gradeSize: product.gradeSize || 'medium',
      imageUrl: product.imageUrl || '',
      quantityInStock: product.Inventory?.quantityInStock ?? 0,
    });
    setRestockQty('');
    setImageFile(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const { data } = await api.post('/admin/upload', fd);
        imageUrl = data.url;
      }
      const payload = { ...form, imageUrl, price: Number(form.price), packSize: form.packSize ? Number(form.packSize) : null };

      if (editing) {
        delete payload.quantityInStock; // stock changes go through restock below
        await api.patch(`/admin/products/${editing.id}`, payload);
        if (Number(restockQty) > 0) {
          await api.post(`/admin/products/${editing.id}/restock`, { quantity: Number(restockQty) });
        }
        toast(`${form.name} updated`);
      } else {
        payload.quantityInStock = Number(form.quantityInStock);
        await api.post('/admin/products', payload);
        toast(`${form.name} added`);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save product');
    }
  };

  const inputClass = 'px-3 py-2 border border-black/15 rounded bg-white text-sm w-full focus:outline-none focus:border-green';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Products</h1>

      {/* Add / edit form */}
      <form ref={formRef} onSubmit={submit} className="mt-8 bg-white border border-black/5 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-green">
            {editing ? `Editing: ${editing.name}` : 'Add New Egg Product'}
          </p>
          {editing && (
            <button type="button" onClick={resetForm} className="text-xs text-black/40 hover:text-red-500">
              Cancel edit
            </button>
          )}
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <label className={labelClass}>Product name *
            <input required value={form.name} onChange={set('name')} className={inputClass} />
          </label>
          <label className={labelClass}>Price (GHS) *
            <input required type="number" step="0.01" min="0" value={form.price} onChange={set('price')} className={inputClass} />
          </label>
          <label className={labelClass}>Egg type
            <select value={form.eggType} onChange={set('eggType')} className={inputClass}>
              <option value="chicken">Chicken</option>
              <option value="duck">Duck</option>
              <option value="quail">Quail</option>
              <option value="guinea_fowl">Guinea Fowl</option>
              <option value="turkey">Turkey</option>
            </select>
          </label>
          <label className={labelClass}>Farming method
            <select value={form.farmingMethod} onChange={set('farmingMethod')} className={inputClass}>
              <option value="free_range">Free Range</option>
              <option value="organic">Organic</option>
              <option value="caged">Caged</option>
              <option value="pasture_raised">Pasture Raised</option>
            </select>
          </label>
          <label className={labelClass}>Grade / size
            <select value={form.gradeSize} onChange={set('gradeSize')} className={inputClass}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra_large">Extra Large</option>
              <option value="jumbo">Jumbo</option>
            </select>
          </label>
          <label className={labelClass}>Pack size (eggs per carton)
            <input type="number" min="0" value={form.packSize} onChange={set('packSize')} className={inputClass} />
          </label>
          {editing ? (
            <label className={labelClass}>Add stock (current: {editing.Inventory?.quantityInStock ?? 0})
              <input type="number" min="0" value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                className={inputClass} />
            </label>
          ) : (
            <label className={labelClass}>Initial stock
              <input type="number" min="0" value={form.quantityInStock} onChange={set('quantityInStock')} className={inputClass} />
            </label>
          )}
          <label className={labelClass}>Product image
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)}
              className={`${inputClass} file:mr-2 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-ink file:text-white file:text-xs`} />
          </label>
          <label className={labelClass}>Or image URL
            <input value={form.imageUrl} onChange={set('imageUrl')} className={inputClass} />
          </label>
          <label className={`${labelClass} md:col-span-3`}>Description
            <textarea value={form.description} onChange={set('description')} className={inputClass} rows={2} />
          </label>
          <label className={labelClass}>SKU * (auto-generated — edit to override)
            <input
              required
              value={form.sku}
              onChange={(e) => { setSkuTouched(e.target.value !== ''); setForm({ ...form, sku: e.target.value }); }}
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="px-6 py-2 rounded-full bg-ink text-white text-sm hover:bg-green transition-colors">
            {editing ? 'Save Changes' : 'Add Product'}
          </button>
          {message && <span className="text-sm text-red-600">{message}</span>}
        </div>
      </form>

      {/* Search & filters */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className={labelClass}>Search products
          <input
            value={filters.search}
            onChange={setFilter('search')}
            className="w-full sm:w-56 px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-green"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <label className={labelClass}>Egg type
            <select value={filters.eggType} onChange={setFilter('eggType')}
              className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none">
              <option value="">All types</option>
              <option value="chicken">Chicken</option>
              <option value="duck">Duck</option>
              <option value="quail">Quail</option>
              <option value="guinea_fowl">Guinea Fowl</option>
              <option value="turkey">Turkey</option>
            </select>
          </label>
        </div>
        <span className="text-sm text-black/40 sm:pb-2">{total} products</span>
      </div>

      {/* Product table */}
      <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left">
            <tr>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Egg type</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-t border-black/5 ${editing?.id === p.id ? 'bg-green/5' : ''}`}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/5 rounded overflow-hidden shrink-0">
                      {p.imageUrl && <img src={resolveAssetUrl(p.imageUrl)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-black/40">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">{EGG_TYPE_LABELS[p.eggType] || 'Chicken'}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">GHS {money(p.price)}</td>
                <td className="px-3 py-2.5">
                  <span className={p.Inventory?.quantityInStock <= 5 ? 'text-red-600 font-medium' : ''}>
                    {p.Inventory?.quantityInStock ?? 0}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => startEdit(p)}
                    className="text-xs px-4 py-1.5 rounded-full border border-black/15 hover:border-green hover:text-green transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
