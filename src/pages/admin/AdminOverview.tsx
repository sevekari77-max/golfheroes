import { useEffect, useState } from 'react';
import { Users, CreditCard, Trophy, Heart, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/types';
import { Link } from 'react-router-dom';

export function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    totalWinners: 0,
    pendingVerifications: 0,
    publishedDraws: 0,
    totalCharities: 0,
    prizePoolEstimate: 0,
    charityTotal: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, subsRes, winnersRes, verRes, drawsRes, charRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('amount_pence').eq('status', 'active'),
        supabase.from('winners').select('id', { count: 'exact' }),
        supabase.from('winner_verifications').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('draws').select('id', { count: 'exact' }).eq('status', 'published'),
        supabase.from('charities').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      const activeSubs = subsRes.data ?? [];
      const totalRevenue = activeSubs.reduce((s: number, r: any) => s + r.amount_pence, 0);

      setStats({
        totalUsers: usersRes.count ?? 0,
        activeSubscribers: activeSubs.length,
        totalWinners: winnersRes.count ?? 0,
        pendingVerifications: verRes.count ?? 0,
        publishedDraws: drawsRes.count ?? 0,
        totalCharities: charRes.count ?? 0,
        prizePoolEstimate: Math.floor(totalRevenue * 0.6),
        charityTotal: Math.floor(totalRevenue * 0.1),
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-stone-400 text-sm mt-1">Platform metrics and quick actions</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'accent', link: '/admin/users' },
          { icon: CreditCard, label: 'Active Subscribers', value: stats.activeSubscribers, color: 'primary', link: '/admin/users' },
          { icon: Trophy, label: 'Total Winners', value: stats.totalWinners, color: 'gold', link: '/admin/winners' },
          { icon: Zap, label: 'Draws Published', value: stats.publishedDraws, color: 'primary', link: '/admin/draws' },
        ].map(({ icon: Icon, label, value, color, link }) => (
          <Link key={label} to={link}>
            <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl hover:border-stone-600/60 transition-all hover:-translate-y-0.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'accent' ? 'bg-accent-500/15' :
                color === 'gold' ? 'bg-secondary-500/15' : 'bg-primary-500/15'
              }`}>
                <Icon className={`w-5 h-5 ${
                  color === 'accent' ? 'text-accent-400' :
                  color === 'gold' ? 'text-secondary-400' : 'text-primary-400'
                }`} />
              </div>
              <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
              <p className="text-stone-400 text-xs mt-1">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, label: 'Est. Prize Pool', value: formatCurrency(stats.prizePoolEstimate), color: 'gold' },
          { icon: Heart, label: 'Charity Total', value: formatCurrency(stats.charityTotal), color: 'error' },
          { icon: Trophy, label: 'Pending Verifications', value: stats.pendingVerifications, color: 'warning', link: '/admin/winners' },
        ].map(({ icon: Icon, label, value, color, link }) => (
          <div key={label} className={`p-5 bg-stone-900/60 border rounded-2xl ${
            color === 'warning' && stats.pendingVerifications > 0
              ? 'border-warning-500/30 bg-warning-500/5'
              : 'border-stone-700/40'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'gold' ? 'bg-secondary-500/15' :
              color === 'error' ? 'bg-error-500/15' : 'bg-warning-500/15'
            }`}>
              <Icon className={`w-5 h-5 ${
                color === 'gold' ? 'text-secondary-400' :
                color === 'error' ? 'text-error-400' : 'text-warning-400'
              }`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-stone-400 text-xs mt-1">{label}</p>
            {link && <Link to={link} className="text-primary-400 text-xs mt-2 inline-block hover:text-primary-300">Review →</Link>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/admin/draws', label: 'Run Draw', icon: Zap, color: 'primary' },
            { to: '/admin/winners', label: 'Verify Winners', icon: Trophy, color: 'gold' },
            { to: '/admin/charities', label: 'Add Charity', icon: Heart, color: 'error' },
            { to: '/admin/analytics', label: 'View Analytics', icon: TrendingUp, color: 'accent' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}>
              <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:-translate-y-0.5 ${
                color === 'primary' ? 'bg-primary-500/10 border-primary-500/20 hover:border-primary-500/40' :
                color === 'gold' ? 'bg-secondary-500/10 border-secondary-500/20 hover:border-secondary-500/40' :
                color === 'error' ? 'bg-error-500/10 border-error-500/20 hover:border-error-500/40' :
                'bg-accent-500/10 border-accent-500/20 hover:border-accent-500/40'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'primary' ? 'text-primary-400' :
                  color === 'gold' ? 'text-secondary-400' :
                  color === 'error' ? 'text-error-400' : 'text-accent-400'
                }`} />
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
