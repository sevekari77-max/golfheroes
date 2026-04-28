import { useState } from 'react';
import { User, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [country, setCountry] = useState(profile?.country ?? 'IE');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Name is required'); return; }
    setError('');
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        country,
        updated_at: new Date().toISOString(),
      }).eq('id', profile!.id);
      if (error) throw error;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-up max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-stone-400 text-sm mt-1">Manage your account details</p>
      </div>

      <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-700/50">
          <div className="w-16 h-16 bg-primary-600/20 border border-primary-500/30 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{profile?.full_name}</p>
            <p className="text-stone-400 text-sm">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full bg-stone-800/50 border border-stone-700 rounded-xl px-4 py-3 text-stone-500 cursor-not-allowed"
            />
            <p className="text-stone-600 text-xs mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+353..."
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
            >
              <option value="IE">Ireland</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
              <option value="AU">Australia</option>
              <option value="CA">Canada</option>
            </select>
          </div>

          {error && <p className="text-error-400 text-sm">{error}</p>}

          <Button
            onClick={handleSave}
            loading={saving}
            icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            variant={saved ? 'secondary' : 'primary'}
            className="w-full"
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
