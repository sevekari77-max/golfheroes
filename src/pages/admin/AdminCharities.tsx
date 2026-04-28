import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Star, Globe, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Charity, formatCurrency } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const emptyCharity = (): Partial<Charity> => ({
  name: '',
  slug: '',
  description: '',
  short_description: '',
  logo_url: '',
  cover_image_url: '',
  website_url: '',
  category: 'general',
  country: 'IE',
  is_featured: false,
  is_active: true,
});

export function AdminCharities() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Charity>>(emptyCharity());
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('is_featured', { ascending: false }).order('name');
    setCharities(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCharities(); }, []);

  const openCreate = () => {
    setForm(emptyCharity());
    setIsEdit(false);
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Charity) => {
    setForm({ ...c });
    setIsEdit(true);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError('Name is required'); return; }
    if (!form.slug?.trim()) { setError('Slug is required'); return; }
    if (!form.short_description?.trim()) { setError('Short description is required'); return; }

    setSaving(true);
    setError('');
    try {
      if (isEdit && form.id) {
        const { error } = await supabase.from('charities').update({
          ...form,
          updated_at: new Date().toISOString(),
        }).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('charities').insert(form);
        if (error) throw error;
      }
      await fetchCharities();
      setShowModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('charities').delete().eq('id', id);
    setDeleteId(null);
    fetchCharities();
  };

  const handleToggleFeatured = async (c: Charity) => {
    if (!c.is_featured) {
      // Unfeatured all first
      await supabase.from('charities').update({ is_featured: false }).eq('is_featured', true);
    }
    await supabase.from('charities').update({ is_featured: !c.is_featured }).eq('id', c.id);
    fetchCharities();
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Charity Management</h1>
          <p className="text-stone-400 text-sm mt-1">{charities.length} charities</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>Add Charity</Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {charities.map(charity => (
            <div key={charity.id} className="flex items-center justify-between p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl hover:border-stone-600/60 transition-all">
              <div className="flex items-center gap-4 min-w-0">
                {charity.logo_url ? (
                  <img src={charity.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-error-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium text-sm truncate">{charity.name}</p>
                    {charity.is_featured && <Badge variant="gold">Featured</Badge>}
                    {!charity.is_active && <Badge variant="error">Inactive</Badge>}
                  </div>
                  <p className="text-stone-400 text-xs capitalize">{charity.category} · {formatCurrency(charity.total_raised)} raised</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleFeatured(charity)}
                  className={`p-2 rounded-lg transition-colors ${
                    charity.is_featured
                      ? 'text-secondary-400 bg-secondary-500/10 hover:bg-secondary-500/20'
                      : 'text-stone-500 hover:text-secondary-400 hover:bg-stone-700/50'
                  }`}
                  title={charity.is_featured ? 'Remove spotlight' : 'Set as spotlight'}
                >
                  <Star className={`w-4 h-4 ${charity.is_featured ? 'fill-secondary-400' : ''}`} />
                </button>
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-stone-500 hover:text-accent-400 hover:bg-stone-700/50 transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => openEdit(charity)} className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700/50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(charity.id)} className="p-2 rounded-lg text-stone-400 hover:text-error-400 hover:bg-error-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {charities.length === 0 && (
            <div className="py-12 text-center text-stone-500">No charities yet</div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEdit ? 'Edit Charity' : 'Add Charity'} size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-400 mb-1">Name *</label>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || generateSlug(e.target.value) }))}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug ?? ''}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Category</label>
              <select
                value={form.category ?? 'general'}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              >
                {['general', 'health', 'children', 'community', 'animals', 'education'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-400 mb-1">Short Description *</label>
              <input
                type="text"
                value={form.short_description ?? ''}
                onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                maxLength={120}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-400 mb-1">Full Description</label>
              <textarea
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logo_url ?? ''}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Cover Image URL</label>
              <input
                type="url"
                value={form.cover_image_url ?? ''}
                onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Website URL</label>
              <input
                type="url"
                value={form.website_url ?? ''}
                onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Country</label>
              <select
                value={form.country ?? 'IE'}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="IE">Ireland</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="accent-primary-500"
                />
                <span className="text-stone-300 text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured ?? false}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="accent-secondary-500"
                />
                <span className="text-stone-300 text-sm">Featured</span>
              </label>
            </div>
          </div>
        </div>
        {error && <p className="text-error-400 text-sm mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={handleSave}>{isEdit ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Charity">
        <p className="text-stone-300 mb-6 text-sm">This will permanently delete the charity and remove it from all user selections.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
