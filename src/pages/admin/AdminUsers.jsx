import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { confirmDialog } from '../../store/dialogStore';
import { formatDate } from '../../lib/format';

export default function AdminUsers() {
  const currentUser = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [busy, setBusy] = useState(null);
  // Typing into search fires a new request before the previous one resolves —
  // this guards against a slower earlier response overwriting a later one.
  const requestIdRef = useRef(0);

  const load = () => {
    setLoading(true);
    const requestId = ++requestIdRef.current;
    const params = { pageSize: 200 };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    api.get('/admin/users', { params })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setUsers(res.data.users);
        setTotal(res.data.total);
      })
      .catch(() => { if (requestId === requestIdRef.current) setUsers([]); })
      .finally(() => { if (requestId === requestIdRef.current) setLoading(false); });
  };

  useEffect(() => {
    if (!currentUser?.isAdmin) return navigate('/');
    const timer = setTimeout(load, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentUser, navigate, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentUser?.isAdmin) return null;

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber || '' });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    setBusy(id);
    try {
      await api.patch(`/admin/users/${id}`, editForm);
      toast('User updated');
      setEditingId(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update user', 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleStatus = async (u) => {
    const suspending = u.accountStatus === 'active';
    if (suspending) {
      const ok = await confirmDialog({
        title: 'Suspend Account',
        message: `Suspend ${u.firstName} ${u.lastName}? They'll be signed out immediately and won't be able to log in until reactivated.`,
        confirmLabel: 'Suspend',
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(u.id);
    try {
      await api.patch(`/admin/users/${u.id}/status`, { status: suspending ? 'suspended' : 'active' });
      toast(`${u.firstName} ${u.lastName} ${suspending ? 'suspended' : 'reactivated'}`);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update account status', 'error');
    } finally {
      setBusy(null);
    }
  };

  const inputClass = 'px-2 py-1 border border-black/15 rounded bg-white text-xs w-full focus:outline-none focus:border-green';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-4xl">Customer Accounts</h1>
      <p className="text-sm text-black/40 mt-2">
        Update customer details or suspend an account to immediately block sign-in and sign out any active session.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className={labelClass}>Search
          <input
            value={filters.search}
            onChange={setFilter('search')}
            placeholder="Name or email…"
            className="w-full sm:w-64 px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-green"
          />
        </label>
        <label className={labelClass}>Status
          <select value={filters.status} onChange={setFilter('status')}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <span className="text-sm text-black/40 sm:pb-2">{total} accounts</span>
      </div>

      {loading ? (
        <p className="mt-12 text-center text-black/40">Loading accounts…</p>
      ) : users.length ? (
        <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-left">
              <tr>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editingId === u.id;
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className={`border-t border-black/5 align-top ${u.accountStatus === 'suspended' ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <input value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className={inputClass} placeholder="First name" />
                          <input value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className={inputClass} placeholder="Last name" />
                        </div>
                      ) : (
                        <p>{u.firstName} {u.lastName}{isSelf && <span className="text-black/30"> (you)</span>}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-xs">{u.email}</p>
                      {isEditing ? (
                        <input value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                          className={`${inputClass} mt-1`} placeholder="Phone number" />
                      ) : (
                        <p className="text-xs text-black/40">{u.phoneNumber || '—'}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-black/5 text-black/50'}`}>
                        {u.isAdmin ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.accountStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.accountStatus === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-black/40 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(u.id)} disabled={busy === u.id}
                            className="text-xs px-4 py-1.5 rounded-full bg-ink text-white hover:bg-green transition-colors disabled:opacity-40">
                            Save
                          </button>
                          <button onClick={cancelEdit} disabled={busy === u.id}
                            className="ml-2 text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/40 hover:text-black transition-colors disabled:opacity-40">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} disabled={busy === u.id}
                            className="text-xs px-4 py-1.5 rounded-full border border-black/15 hover:border-green hover:text-green transition-colors disabled:opacity-40">
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={busy === u.id || isSelf}
                            title={isSelf ? "You can't change your own account status" : undefined}
                            className="ml-2 text-xs px-4 py-1.5 rounded-full border border-black/15 text-black/40 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-12 text-center text-black/40">No accounts match your filters.</p>
      )}
    </div>
  );
}
