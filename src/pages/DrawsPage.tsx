import { useEffect, useState } from 'react';
import { Zap, Trophy } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { Draw, MONTHS, formatCurrency } from '../lib/types';
import { Badge } from '../components/ui/Badge';

export function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('draws')
      .select('*, draw_numbers(*), winners(*)')
      .eq('status', 'published')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .then(({ data }) => {
        setDraws(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full mb-4">
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-primary-400 text-sm font-medium">Monthly Draws</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Draw Results</h1>
            <p className="text-stone-400 text-lg max-w-xl mx-auto">
              Each month, 5 numbers are drawn. Match 3, 4, or all 5 to win your share of the prize pool.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { tier: '5 Numbers', share: '40%', color: 'gold', note: 'Jackpot — rolls over' },
              { tier: '4 Numbers', share: '35%', color: 'primary', note: 'Split among winners' },
              { tier: '3 Numbers', share: '25%', color: 'accent', note: 'Split among winners' },
            ].map(({ tier, share, color, note }) => (
              <div key={tier} className={`p-4 rounded-xl border text-center ${
                color === 'gold' ? 'bg-secondary-500/10 border-secondary-500/20' :
                color === 'primary' ? 'bg-primary-500/10 border-primary-500/20' :
                'bg-accent-500/10 border-accent-500/20'
              }`}>
                <p className={`font-bold text-lg ${
                  color === 'gold' ? 'text-secondary-400' :
                  color === 'primary' ? 'text-primary-400' : 'text-accent-400'
                }`}>{tier}</p>
                <p className="text-white font-bold text-xl">{share}</p>
                <p className="text-stone-500 text-xs mt-1">{note}</p>
              </div>
            ))}
          </div>

          {/* Draws list */}
          {loading ? (
            <div className="py-20 text-center text-stone-500">Loading draws...</div>
          ) : draws.length === 0 ? (
            <div className="py-16 text-center bg-stone-900/40 border border-stone-700/30 rounded-2xl">
              <Zap className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">No draws yet</p>
              <p className="text-stone-400 text-sm">Check back after the first monthly draw is run.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {draws.map((draw, idx) => {
                const numbers = (draw.draw_numbers ?? []).sort((a: any, b: any) => a.position - b.position);
                const winners = draw.winners ?? [];
                const fiveMatch = winners.filter((w: any) => w.match_tier === 5);
                const fourMatch = winners.filter((w: any) => w.match_tier === 4);
                const threeMatch = winners.filter((w: any) => w.match_tier === 3);

                return (
                  <div key={draw.id} className={`bg-stone-900/60 border rounded-2xl overflow-hidden ${
                    idx === 0 ? 'border-primary-500/30' : 'border-stone-700/40'
                  }`}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-primary-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{MONTHS[draw.month - 1]} {draw.year}</h3>
                          <p className="text-stone-400 text-xs capitalize">{draw.draw_type} draw</p>
                        </div>
                        {idx === 0 && <Badge variant="success">Latest</Badge>}
                      </div>
                      <div className="text-right">
                        <p className="text-stone-400 text-xs">Prize Pool</p>
                        <p className="text-white font-bold">{formatCurrency(draw.prize_pool_total)}</p>
                      </div>
                    </div>

                    <div className="px-6 py-5">
                      {/* Winning numbers */}
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-stone-400 text-sm">Winning numbers:</span>
                        <div className="flex gap-2">
                          {numbers.map((dn: any) => (
                            <div
                              key={dn.id}
                              className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-glow-green"
                            >
                              {dn.number}
                            </div>
                          ))}
                          {numbers.length === 0 && (
                            <span className="text-stone-500 text-sm">Numbers pending</span>
                          )}
                        </div>
                      </div>

                      {/* Winners breakdown */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: '5-Match', winners: fiveMatch, color: 'gold', pool: draw.prize_pool_total * 0.4 },
                          { label: '4-Match', winners: fourMatch, color: 'primary', pool: draw.prize_pool_total * 0.35 },
                          { label: '3-Match', winners: threeMatch, color: 'accent', pool: draw.prize_pool_total * 0.25 },
                        ].map(({ label, winners, color, pool }) => (
                          <div key={label} className="p-3 bg-stone-800/50 rounded-xl">
                            <p className={`font-bold text-sm ${
                              color === 'gold' ? 'text-secondary-400' :
                              color === 'primary' ? 'text-primary-400' : 'text-accent-400'
                            }`}>{label}</p>
                            <p className="text-white font-bold">{winners.length} winner{winners.length !== 1 ? 's' : ''}</p>
                            {winners.length > 0 && (
                              <p className="text-stone-400 text-xs">
                                {formatCurrency(Math.floor(pool / winners.length))} each
                              </p>
                            )}
                            {winners.length === 0 && label === '5-Match' && draw.jackpot_amount > 0 && (
                              <p className="text-secondary-400 text-xs">Jackpot rolls over</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {draw.jackpot_amount > 0 && (
                        <div className="mt-4 p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl">
                          <p className="text-secondary-400 text-sm font-medium">
                            Jackpot includes {formatCurrency(draw.jackpot_amount)} rollover from previous month
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
