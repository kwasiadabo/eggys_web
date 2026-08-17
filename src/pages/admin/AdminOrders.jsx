import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bike } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { confirmDialog } from '../../store/dialogStore';
import { money, formatDate, formatDateTime } from '../../lib/format';
import SearchableSelect from '../../components/SearchableSelect';

// 'delivered' is deliberately excluded here — those orders live on the History tab.
const CURRENT_STATUSES = ['pending', 'pending_delivery', 'dispatched', 'cancelled'];

const badge = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AdminOrders() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [tab, setTab] = useState('current'); // 'current' | 'history'
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState(''); // status dropdown — current tab only
  const [destination, setDestination] = useState('');
  const [riderFilter, setRiderFilter] = useState('');
  // Current tab defaults to today so the page opens on today's active orders;
  // History defaults to no range (every delivered order) until narrowed.
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const switchTab = (next) => {
    setTab(next);
    setFilter('');
    setDestination('');
    setRiderFilter('');
    if (next === 'current') {
      setDateFrom(todayStr());
      setDateTo(todayStr());
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const load = () => {
    setLoading(true);
    const params = {};
    params.status = tab === 'history' ? 'delivered' : (filter || 'active');
    if (destination) params.destination = destination;
    if (riderFilter) params.rider = riderFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    api.get('/admin/orders', { params })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    const timer = setTimeout(load, destination ? 300 : 0); // debounce typing
    return () => clearTimeout(timer);
  }, [user, navigate, tab, filter, destination, riderFilter, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/admin/delivery-persons').then((res) => setRiders(res.data)).catch(() => {});
  }, [user]);

  if (!user?.isAdmin) return null;

  const dispatch = async (order) => {
    const ok = await confirmDialog({
      title: 'Dispatch Order',
      message: `Dispatch ${order.orderNumber} with ${order.DeliveryPerson.name}? They'll receive it by SMS.`,
      confirmLabel: 'Dispatch',
    });
    if (!ok) return;
    setUpdating(order.id);
    try {
      const { data } = await api.post(`/admin/delivery-persons/${order.DeliveryPerson.id}/dispatch`, {
        orderIds: [order.id],
      });
      toast(`${order.orderNumber} dispatched${data.smsSent ? ' — notified by SMS' : ''}`);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to dispatch order', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const assignRider = async (order, deliveryPersonId) => {
    setUpdating(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/assign`, { deliveryPersonId: deliveryPersonId || null });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to assign rider', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Orders</h1>
        <div className="flex gap-1 p-1 rounded-full bg-black/5">
          <button
            onClick={() => switchTab('current')}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${tab === 'current' ? 'bg-white shadow-sm font-medium' : 'text-black/50 hover:text-black'}`}
          >
            Current
          </button>
          <button
            onClick={() => switchTab('history')}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${tab === 'history' ? 'bg-white shadow-sm font-medium' : 'text-black/50 hover:text-black'}`}
          >
            History
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">From
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-green"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">To
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-green"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Search
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Order #, customer, or address"
            className="w-full sm:w-56 px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-green"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Rider
          <SearchableSelect
            value={riderFilter}
            onChange={setRiderFilter}
            placeholder="All riders"
            searchPlaceholder="Search riders…"
            options={[
              { value: '', label: 'All riders' },
              { value: 'unassigned', label: 'Unassigned' },
              ...riders.map((r) => ({ value: r.id, label: r.name })),
            ]}
            triggerClassName="w-full sm:w-40 px-4 py-2 rounded-full border border-black/15 bg-white text-sm"
          />
        </label>
        {tab === 'current' && (
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Status
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
            >
              <option value="">All active</option>
              {CURRENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
        )}
      </div>

      {loading ? (
        <p className="mt-12 text-center text-black/40">Loading orders…</p>
      ) : orders.length ? (
        <div className="mt-8 bg-white border border-black/5 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-left">
              <tr>
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Rider</th>
                <th className="px-3 py-3 font-medium">Dispatch</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-black/5 align-top">
                  <td className="px-3 py-3">
                    <p className="font-mono text-xs">{order.orderNumber}</p>
                    <p className="text-xs mt-1">
                      {order.User ? `${order.User.firstName} ${order.User.lastName}` : order.guestName}
                    </p>
                    <p className="text-xs text-black/40">
                      {order.User?.phoneNumber || order.User?.email || order.guestPhone || order.guestEmail}
                    </p>
                    <p className="text-xs text-black/40 mt-0.5">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    {order.OrderItems?.length ? (
                      <ul className="space-y-0.5">
                        {order.OrderItems.map((item) => (
                          <li key={item.id} className="text-xs">
                            {item.quantity}× {item.Product?.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-red-600">⚠ No items on this order</p>
                    )}
                    <p className="text-xs text-green mt-1.5 flex items-center gap-1">
                      <MapPin size={12} strokeWidth={2} className="shrink-0" /> {order.shippingAddress || 'No address'}
                    </p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs font-medium">GHS {money(order.totalAmount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${badge[order.status] || ''}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        pay: {order.paymentStatus}
                      </span>
                      {order.status === 'delivered' && order.deliveredAt && (
                        <span className="text-[10px] text-black/40">
                          Delivered {formatDateTime(order.deliveredAt)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {order.status === 'pending_delivery' ? (
                      <SearchableSelect
                        value={order.DeliveryPerson?.id || ''}
                        disabled={updating === order.id}
                        onChange={(deliveryPersonId) => assignRider(order, deliveryPersonId)}
                        placeholder="— Unassigned —"
                        searchPlaceholder="Search riders…"
                        options={[
                          { value: '', label: '— Unassigned —' },
                          ...riders.filter((r) => r.isActive).map((r) => ({ value: r.id, label: r.name })),
                        ]}
                        triggerClassName="w-36 px-2 py-1 rounded border border-black/15 bg-white text-xs"
                      />
                    ) : order.DeliveryPerson ? (
                      <p className="text-xs whitespace-nowrap flex items-center gap-1">
                        <Bike size={13} strokeWidth={2} className="shrink-0" /> {order.DeliveryPerson.name}
                      </p>
                    ) : (
                      <span className="text-xs text-black/30">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {order.status === 'pending_delivery' && order.DeliveryPerson ? (
                      <button
                        onClick={() => dispatch(order)}
                        disabled={updating === order.id}
                        className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full bg-ink text-white text-xs hover:bg-green transition-colors disabled:opacity-40"
                      >
                        {updating === order.id ? 'Dispatching…' : 'Dispatch'}
                      </button>
                    ) : (
                      <span className="text-xs text-black/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-12 text-center text-black/40">
          No {tab === 'history' ? 'delivered orders' : 'current orders'}
          {tab === 'current' && filter ? ` with status "${filter.replace(/_/g, ' ')}"` : ''}
          {dateFrom || dateTo ? (
            <>
              {' '}between {dateFrom ? formatDate(`${dateFrom}T00:00:00`) : 'the beginning'} and{' '}
              {dateTo ? formatDate(`${dateTo}T00:00:00`) : 'now'} — clear the date range to see more.
            </>
          ) : (
            '.'
          )}
        </p>
      )}
    </div>
  );
}
