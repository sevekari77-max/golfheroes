import { useEffect, useState } from 'react';
import { Heart, Search, CheckCircle2, ArrowRight, Sliders } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Charity, UserCharity, formatCurrency } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export function CharityPage() {
  const { user, subscription } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPctModal, setShowPctModal] = useState(false);
  const [newPct, setNewPct] = useState(10);
  const [saving, setSaving] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const [charitiesRes, userCharityRes] = await Promise.all([
      supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }),
      supabase.from('user_charities').select('*, charity:charities(*)').eq('user_id', user.id).maybeSingle(),
    ]);
    setCharities(charitiesRes.data ?? []);
    setUserCharity(userCharityRes.data);
    if (userCharityRes.data) setNewPct(userCharityRes.data.contribution_percentage);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSelectCharity = async (charityId: string) => {
    setSelecting(charityId);
    try {
      if (userCharity) {
        await supabase.from('user_charities').update({
          charity_id: charityId,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user!.id);
      } else {
        await supabase.from('user_charities').insert({
          user_id: user!.id,
          charity_id: charityId,
          contribution_percentage: 10,
        });
      }
      await fetchData();
    } finally {
      setSelecting(null);
    }
  };

  const handleUpdatePct = async () => {
    setSaving(true);
    try {
      await supabase.from('user_charities').update({
        contribution_percentage: newPct,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user!.id);
      await fetchData();
      setShowPctModal(false);
    } finally {
      setSaving(false);
    }
  };

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const currentCharity = (userCharity as any)?.charity as Charity | undefined;
  const monthlyContribution = subscription
    ? Math.floor(subscription.amount_pence * (userCharity?.contribution_percentage ?? 10) / 100)
    : 0;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Charity</h1>
        <p className="text-stone-400 text-sm mt-1">Select and manage your charitable contribution</p>
      </div>

      {/* Current selection */}
      {currentCharity && (
        <div className="mb-8 p-6 bg-gradient-to-r from-error-900/30 to-stone-900/60 border border-error-700/30 rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {currentCharity.logo_url && (
                <img src={currentCharity.logo_url} alt={currentCharity.name} className="w-14 h-14 rounded-xl object-cover" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span className="text-success-400 text-xs font-medium uppercase tracking-wide">Selected</span>
                </div>
                <h3 className="text-white font-bold text-lg">{currentCharity.name}</h3>
                <p className="text-stone-400 text-sm">{currentCharity.short_description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-xs text-stone-500">Your contribution</p>
                    <p className="text-error-400 font-bold">{userCharity?.contribution_percentage}% / {formatCurrency(monthlyContribution)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Total raised</p>
                    <p className="text-primary-400 font-bold">{formatCurrency(currentCharity.total_raised)}</p>
                  </div>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPctModal(true)}
              icon={<Sliders className="w-4 h-4" />}
            >
              Adjust %
            </Button>
          </div>
        </div>
      )}

      {!currentCharity && (
        <div className="mb-8 p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl">
          <p className="text-warning-400 text-sm font-medium">No charity selected</p>
          <p className="text-stone-400 text-xs mt-1">Choose a charity below to start contributing from your subscription.</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search charities..."
          className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Charity grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading charities...</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(charity => {
            const isSelected = userCharity?.charity_id === charity.id;
            return (
              <div
                key={charity.id}
                className={`p-5 bg-stone-900/60 border rounded-2xl transition-all ${
                  isSelected
                    ? 'border-error-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                    : 'border-stone-700/40 hover:border-stone-600/60'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {charity.logo_url ? (
                    <img src={charity.logo_url} alt={charity.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-error-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm truncate">{charity.name}</h3>
                      {charity.is_featured && (
                        <span className="text-xs px-1.5 py-0.5 bg-secondary-500/20 text-secondary-400 rounded-full flex-shrink-0">Featured</span>
                      )}
                    </div>
                    <p className="text-stone-500 text-xs capitalize">{charity.category}</p>
                  </div>
                </div>
                <p className="text-stone-400 text-xs mb-4 line-clamp-2">{charity.short_description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-stone-500">
                    {formatCurrency(charity.total_raised)} raised
                  </div>
                  {isSelected ? (
                    <div className="flex items-center gap-1.5 text-success-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selected
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={selecting === charity.id}
                      onClick={() => handleSelectCharity(charity.id)}
                      iconRight={<ArrowRight className="w-3 h-3" />}
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Percentage modal */}
      <Modal isOpen={showPctModal} onClose={() => setShowPctModal(false)} title="Adjust Contribution">
        <div className="space-y-4">
          <p className="text-stone-400 text-sm">
            Set what percentage of your subscription goes to {currentCharity?.name}. Minimum is 10%.
          </p>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-3">
              Contribution: <span className="text-error-400 font-bold">{newPct}%</span>
              {subscription && (
                <span className="text-stone-500 ml-2">= {formatCurrency(Math.floor(subscription.amount_pence * newPct / 100))}/mo</span>
              )}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={newPct}
              onChange={e => setNewPct(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-stone-500 mt-1">
              <span>10% (min)</span>
              <span>100%</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPctModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleUpdatePct}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
