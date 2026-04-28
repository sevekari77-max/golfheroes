import { useEffect, useState } from 'react';
import { Search, Users, ChevronDown, CreditCard as Edit2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile, Subscription } from '../../lib/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/types';

interface UserWithSub extends Profile {
  subscription?: Subscription;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editUser, setEditUser] = useState<UserWithSub | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'subscriber' | 'admin'>('subscriber');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!profiles) { setLoading(false); return; }

    const userIds = profiles.map(p => p.id);
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .in('user_id', userIds)
      .eq('status', 'active');

    const subMap = new Map((subs ?? []).map(s => [s.user_id, s]));
    setUsers(profiles.map(p => ({ ...p, subscription: subMap.get(p.id) })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true :
      filter === 'active' ? !!u.subscription : !u.subscription;
    return matchSearch && matchFilter;
  });

  const handleEdit = (user: UserWithSub) => {
    setEditUser(user);
    setEditName(user.full_name);
    setEditRole(user.role);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        full_name: editName,
        role: editRole,
        updated_at: new Date().toISOString(),
      }).eq('id', editUser.id);
      await fetchUsers();
      setEditUser(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubscription = async (user: UserWithSub) => {
    if (user.subscription) {
      await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user.id).eq('status', 'active');
    } else {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: 'monthly',
        status: 'active',
        amount_pence: 999,
        currency: 'GBP',
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      });
    }
    fetchUsers();
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-stone-400 text-sm mt-1">{users.length} total users</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading users...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl hover:border-stone-600/60 transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-stone-300 text-sm font-medium">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm truncate">{user.full_name}</p>
                    {user.role === 'admin' && <Badge variant="gold">Admin</Badge>}
                  </div>
                  <p className="text-stone-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:block text-right">
                  {user.subscription ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">No Sub</Badge>
                  )}
                  {user.subscription && (
                    <p className="text-stone-500 text-xs mt-1">
                      {formatCurrency(user.subscription.amount_pence)}/{user.subscription.plan === 'monthly' ? 'mo' : 'yr'}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(user)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-stone-500">No users found</div>
          )}
        </div>
      )}

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Role</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as 'subscriber' | 'admin')}
                className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="subscriber">Subscriber</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Subscription</label>
              <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl">
                <span className="text-stone-300 text-sm">
                  {editUser.subscription ? 'Active subscription' : 'No active subscription'}
                </span>
                <Button
                  size="sm"
                  variant={editUser.subscription ? 'danger' : 'primary'}
                  onClick={() => handleToggleSubscription(editUser)}
                  icon={editUser.subscription ? undefined : <CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {editUser.subscription ? 'Cancel Sub' : 'Activate'}
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={handleSave}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
