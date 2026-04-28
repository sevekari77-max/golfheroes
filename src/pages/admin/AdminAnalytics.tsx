import { useEffect, useState } from 'react';
import { BarChart2, Users, Trophy, Heart, TrendingUp, Zap, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MONTHS, formatCurrency } from '../../lib/types';

export function AdminAnalytics() {
  const [data, setData] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalPrizePool: 0,
    totalCharityContributions: 0,
    totalWinners: 0,
    totalPaidOut: 0,
    charityBreakdown: [] as { name: string; supporters: number; raised: number }[],
    drawStats: [] as { month: number; year: number; winners: number; pool: number }[],
    monthlyGrowth: [] as { month: string; users: number }[],
  });

  useEffect(() => {
    const fetch = async () => {
      const [
        usersRes, subsRes, winnersRes, charitiesRes, drawsRes, userCharitiesRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at').order('created_at'),
        supabase.from('subscriptions').select('amount_pence, status, created_at'),
        supabase.from('winners').select('prize_amount, payment_status'),
        supabase.from('charities').select('name, total_raised, supporter_count, is_active').eq('is_active', true),
        supabase.from('draws').select('month, year, prize_pool_total, status, winners(*)').eq('status', 'published'),
        supabase.from('user_charities').select('charity_id, contribution_percentage'),
      ]);

      const activeSubs = (subsRes.data ?? []).filter((s: any) => s.status === 'active');
      const monthlyRev = activeSubs.reduce((s: number, sub: any) => s + sub.amount_pence, 0);
      const totalRev = (subsRes.data ?? []).reduce((s: number, sub: any) => s + sub.amount_pence, 0);
      const charityTotal = Math.floor(totalRev * 0.10);

      const paidWinners = (winnersRes.data ?? []).filter((w: any) => w.payment_status === 'paid');

      const charBreakdown = (charitiesRes.data ?? [])
        .sort((a: any, b: any) => b.total_raised - a.total_raised)
        .slice(0, 5)
        .map((c: any) => ({
          name: c.name,
          supporters: c.supporter_count,
          raised: c.total_raised,
        }));

      const drawStats = (drawsRes.data ?? []).map((d: any) => ({
        month: d.month,
        year: d.year,
        winners: d.winners?.length ?? 0,
        pool: d.prize_pool_total,
      }));

      // Monthly user growth (last 6 months)
      const usersByMonth: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const key = `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
        usersByMonth[key] = 0;
      }
      for (const user of (usersRes.data ?? [])) {
        const d = new Date(user.created_at);
        const key = `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
        if (key in usersByMonth) usersByMonth[key]++;
      }
      const monthlyGrowth = Object.entries(usersByMonth).map(([month, users]) => ({ month, users }));

      setData({
        totalUsers: usersRes.data?.length ?? 0,
        activeSubscribers: activeSubs.length,
        monthlyRevenue: monthlyRev,
        totalRevenue: totalRev,
        totalPrizePool: Math.floor(totalRev * 0.6),
        totalCharityContributions: charityTotal,
        totalWinners: winnersRes.data?.length ?? 0,
        totalPaidOut: paidWinners.reduce((s: number, w: any) => s + w.prize_amount, 0),
        charityBreakdown: charBreakdown,
        drawStats,
        monthlyGrowth,
      });
    };
    fetch();
  }, []);

  const maxGrowth = Math.max(...data.monthlyGrowth.map(m => m.users), 1);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-stone-400 text-sm mt-1">Platform performance overview</p>
      </div>

      {/* Key metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total Users', value: data.totalUsers.toLocaleString(), color: 'accent' },
          { icon: CreditCard, label: 'Active Subscribers', value: data.activeSubscribers.toLocaleString(), color: 'primary' },
          { icon: TrendingUp, label: 'Monthly Revenue', value: formatCurrency(data.monthlyRevenue), color: 'gold' },
          { icon: Heart, label: 'Charity Total', value: formatCurrency(data.totalCharityContributions), color: 'error' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'accent' ? 'bg-accent-500/15' :
              color === 'gold' ? 'bg-secondary-500/15' :
              color === 'error' ? 'bg-error-500/15' : 'bg-primary-500/15'
            }`}>
              <Icon className={`w-5 h-5 ${
                color === 'accent' ? 'text-accent-400' :
                color === 'gold' ? 'text-secondary-400' :
                color === 'error' ? 'text-error-400' : 'text-primary-400'
              }`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-stone-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Prize & Payout */}
        <div className="p-6 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary-400" />
            Prize & Payout Stats
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Total Prize Pool Created', value: formatCurrency(data.totalPrizePool), color: 'gold' },
              { label: 'Total Paid Out', value: formatCurrency(data.totalPaidOut), color: 'success' },
              { label: 'Total Winners', value: data.totalWinners, color: 'primary' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-stone-800/50">
                <span className="text-stone-400 text-sm">{label}</span>
                <span className={`font-bold text-sm ${
                  color === 'gold' ? 'text-secondary-400' :
                  color === 'success' ? 'text-success-500' : 'text-primary-400'
                }`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth */}
        <div className="p-6 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-400" />
            User Growth (last 6 months)
          </h3>
          <div className="flex items-end gap-2 h-32">
            {data.monthlyGrowth.map(({ month, users }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white text-xs font-medium">{users}</span>
                <div
                  className="w-full bg-primary-600/60 rounded-t hover:bg-primary-500/80 transition-colors"
                  style={{ height: `${Math.max((users / maxGrowth) * 100, 4)}%` }}
                />
                <span className="text-stone-500 text-[10px] text-center">{month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Charity Breakdown */}
        <div className="p-6 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-error-400" />
            Top Charities
          </h3>
          {data.charityBreakdown.length === 0 ? (
            <p className="text-stone-500 text-sm">No charity data yet</p>
          ) : (
            <div className="space-y-3">
              {data.charityBreakdown.map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b border-stone-800/50">
                  <div className="min-w-0 mr-4">
                    <p className="text-white text-sm font-medium truncate">{c.name}</p>
                    <p className="text-stone-500 text-xs">{c.supporters} supporters</p>
                  </div>
                  <p className="text-primary-400 font-bold text-sm flex-shrink-0">{formatCurrency(c.raised)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draw Stats */}
        <div className="p-6 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-400" />
            Draw History
          </h3>
          {data.drawStats.length === 0 ? (
            <p className="text-stone-500 text-sm">No draws published yet</p>
          ) : (
            <div className="space-y-2">
              {data.drawStats.slice(0, 6).map(d => (
                <div key={`${d.month}-${d.year}`} className="flex items-center justify-between p-2.5 bg-stone-800/50 rounded-xl">
                  <span className="text-stone-300 text-sm">{MONTHS[d.month - 1]} {d.year}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-stone-400">{d.winners} winners</span>
                    <span className="text-secondary-400 font-medium">{formatCurrency(d.pool)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
