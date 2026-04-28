import { useEffect, useState } from 'react';
import { Zap, Play, Send, Plus, Eye, Shuffle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Draw, MONTHS, formatCurrency } from '../../lib/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { runDraw, calculatePrizePool } from '../../lib/drawEngine';

export function AdminDraws() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState<Draw | null>(null);
  const [showPublishModal, setShowPublishModal] = useState<Draw | null>(null);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newType, setNewType] = useState<'random' | 'algorithmic'>('random');
  const [creating, setCreating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [jackpotAmount, setJackpotAmount] = useState(0);

  const fetchData = async () => {
    const [drawsRes, configRes, subsRes] = await Promise.all([
      supabase.from('draws').select('*, draw_numbers(*), winners(*)').order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('prize_pool_config').select('*').maybeSingle(),
      supabase.from('subscriptions').select('amount_pence').eq('status', 'active'),
    ]);
    setDraws(drawsRes.data ?? []);
    setConfig(configRes.data);
    setSubscriberCount((subsRes.data ?? []).length);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Calculate prize pool
      const pool = calculatePrizePool(
        subscriberCount,
        config?.monthly_price_pence ?? 999,
        config?.prize_pool_percentage ?? 60,
        jackpotAmount
      );

      const { error } = await supabase.from('draws').insert({
        month: newMonth,
        year: newYear,
        draw_type: newType,
        status: 'pending',
        prize_pool_total: pool,
        jackpot_amount: jackpotAmount,
      });
      if (error) throw error;
      await fetchData();
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSimulate = async (draw: Draw) => {
    setSimulating(true);
    try {
      const { data: allScores } = await supabase.from('scores').select('*');
      const result = runDraw(draw.draw_type, allScores ?? [], draw.prize_pool_total, draw.jackpot_amount);
      setSimResult(result);

      await supabase.from('draws').update({
        status: 'simulated',
        simulation_data: result,
        updated_at: new Date().toISOString(),
      }).eq('id', draw.id);
      await fetchData();
    } finally {
      setSimulating(false);
    }
  };

  const handlePublish = async (draw: Draw) => {
    setPublishing(true);
    try {
      const simData = draw.simulation_data ?? simResult;
      if (!simData) throw new Error('Run simulation first');

      // Save draw numbers
      const numberInserts = simData.numbers.map((num: number, idx: number) => ({
        draw_id: draw.id,
        number: num,
        position: idx + 1,
      }));

      await supabase.from('draw_numbers').delete().eq('draw_id', draw.id);
      await supabase.from('draw_numbers').insert(numberInserts);

      // Find winners among subscribers
      const { data: allScores } = await supabase.from('scores').select('*').order('score_date', { ascending: false });
      const { data: activeSubs } = await supabase.from('subscriptions').select('user_id').eq('status', 'active');

      const activeUserIds = new Set((activeSubs ?? []).map((s: any) => s.user_id));
      const userScoreMap = new Map<string, number[]>();

      for (const score of (allScores ?? [])) {
        if (!activeUserIds.has(score.user_id)) continue;
        const existing = userScoreMap.get(score.user_id) ?? [];
        if (existing.length < 5) {
          userScoreMap.set(score.user_id, [...existing, score.score]);
        }
      }

      const winningNumbers: number[] = simData.numbers;
      const winnersToInsert: any[] = [];

      for (const [userId, scores] of userScoreMap.entries()) {
        const matched = scores.filter((s: number) => winningNumbers.includes(s));
        if (matched.length >= 3) {
          const tier = matched.length >= 5 ? 5 : matched.length >= 4 ? 4 : 3;
          const tierWinnerCount = tier === 5 ? simData.five_match_winners :
            tier === 4 ? simData.four_match_winners : simData.three_match_winners;
          const tierPool = tier === 5 ? simData.prize_breakdown.five_match_pool :
            tier === 4 ? simData.prize_breakdown.four_match_pool : simData.prize_breakdown.three_match_pool;
          const prize = tierWinnerCount > 0 ? Math.floor(tierPool / tierWinnerCount) : 0;

          winnersToInsert.push({
            draw_id: draw.id,
            user_id: userId,
            match_tier: tier,
            matched_numbers: matched,
            prize_amount: prize,
            payment_status: 'pending',
          });
        }
      }

      if (winnersToInsert.length > 0) {
        await supabase.from('winners').insert(winnersToInsert);
      }

      // Handle jackpot rollover
      const hasJackpotWinner = winnersToInsert.some(w => w.match_tier === 5);
      const nextJackpot = hasJackpotWinner ? 0 : simData.prize_breakdown.five_match_pool;

      await supabase.from('draws').update({
        status: 'published',
        published_at: new Date().toISOString(),
        jackpot_amount: nextJackpot > 0 ? nextJackpot : draw.jackpot_amount,
        updated_at: new Date().toISOString(),
      }).eq('id', draw.id);

      await fetchData();
      setShowPublishModal(null);
    } finally {
      setPublishing(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const pool = calculatePrizePool(subscriberCount, config?.monthly_price_pence ?? 999, config?.prize_pool_percentage ?? 60, jackpotAmount);

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Draw Management</h1>
          <p className="text-stone-400 text-sm mt-1">Configure, simulate, and publish monthly draws</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
          New Draw
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Subscribers', value: subscriberCount, color: 'primary' },
          { label: 'Est. Prize Pool', value: formatCurrency(pool), color: 'gold' },
          { label: 'Total Draws', value: draws.length, color: 'accent' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl">
            <p className={`text-xl font-bold ${
              color === 'gold' ? 'text-secondary-400' :
              color === 'accent' ? 'text-accent-400' : 'text-primary-400'
            }`}>{value}</p>
            <p className="text-stone-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading draws...</div>
      ) : (
        <div className="space-y-4">
          {draws.map(draw => {
            const numbers = (draw.draw_numbers ?? []).sort((a: any, b: any) => a.position - b.position);
            const simData = draw.simulation_data as any;
            return (
              <div key={draw.id} className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-bold">{MONTHS[draw.month - 1]} {draw.year}</h3>
                      <Badge variant={
                        draw.status === 'published' ? 'success' :
                        draw.status === 'simulated' ? 'info' :
                        draw.status === 'cancelled' ? 'error' : 'neutral'
                      }>
                        {draw.status}
                      </Badge>
                    </div>
                    <p className="text-stone-400 text-sm capitalize">{draw.draw_type} draw · Pool: {formatCurrency(draw.prize_pool_total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {draw.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={simulating}
                        onClick={() => { setShowSimModal(draw); handleSimulate(draw); }}
                        icon={<Shuffle className="w-3.5 h-3.5" />}
                      >
                        Simulate
                      </Button>
                    )}
                    {draw.status === 'simulated' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={simulating}
                          onClick={() => handleSimulate(draw)}
                          icon={<Shuffle className="w-3.5 h-3.5" />}
                        >
                          Re-simulate
                        </Button>
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() => setShowPublishModal(draw)}
                          icon={<Send className="w-3.5 h-3.5" />}
                        >
                          Publish
                        </Button>
                      </>
                    )}
                    {draw.status === 'published' && (
                      <div className="flex gap-2">
                        {numbers.map((dn: any) => (
                          <span key={dn.id} className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {dn.number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulation preview */}
                {simData && draw.status !== 'published' && (
                  <div className="p-3 bg-stone-800/50 rounded-xl">
                    <p className="text-stone-400 text-xs mb-2">Simulation preview:</p>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-stone-400 text-xs">Numbers:</span>
                      <div className="flex gap-1">
                        {simData.numbers?.map((n: number, i: number) => (
                          <span key={i} className="w-7 h-7 bg-stone-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-stone-400">
                      <span>5-match: <span className="text-secondary-400 font-bold">{simData.five_match_winners}</span></span>
                      <span>4-match: <span className="text-primary-400 font-bold">{simData.four_match_winners}</span></span>
                      <span>3-match: <span className="text-accent-400 font-bold">{simData.three_match_winners}</span></span>
                    </div>
                  </div>
                )}

                {/* Published results */}
                {draw.status === 'published' && (
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="text-stone-400">Winners: <span className="text-white font-medium">{(draw.winners ?? []).length}</span></span>
                    {draw.jackpot_amount > 0 && (
                      <span className="text-secondary-400">Jackpot rollover: {formatCurrency(draw.jackpot_amount)}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {draws.length === 0 && (
            <div className="py-16 text-center bg-stone-900/40 border border-stone-700/30 rounded-2xl">
              <Zap className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">No draws created</p>
              <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>Create First Draw</Button>
            </div>
          )}
        </div>
      )}

      {/* Create Draw Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Draw">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Month</label>
              <select
                value={newMonth}
                onChange={e => setNewMonth(parseInt(e.target.value))}
                className="w-full bg-stone-800 border border-stone-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Year</label>
              <select
                value={newYear}
                onChange={e => setNewYear(parseInt(e.target.value))}
                className="w-full bg-stone-800 border border-stone-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Draw Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['random', 'algorithmic'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`p-3 rounded-xl text-sm font-medium border capitalize transition-all ${
                    newType === t
                      ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                      : 'bg-stone-800 border-stone-600 text-stone-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-stone-500 text-xs mt-1">
              {newType === 'algorithmic' ? 'Weighted by user score frequencies' : 'Standard lottery-style random numbers'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Jackpot Rollover (pence)</label>
            <input
              type="number"
              min="0"
              value={jackpotAmount}
              onChange={e => setJackpotAmount(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="p-3 bg-stone-800/50 rounded-xl">
            <p className="text-stone-400 text-sm">Estimated prize pool: <span className="text-primary-400 font-bold">{formatCurrency(pool)}</span></p>
            <p className="text-stone-500 text-xs">{subscriberCount} active subscribers × {config?.prize_pool_percentage ?? 60}%</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={creating} onClick={handleCreate}>Create Draw</Button>
          </div>
        </div>
      </Modal>

      {/* Publish Confirmation */}
      <Modal isOpen={!!showPublishModal} onClose={() => setShowPublishModal(null)} title="Publish Draw Results">
        <div className="space-y-4">
          <p className="text-stone-300 text-sm">
            Publishing {showPublishModal && `${MONTHS[showPublishModal.month - 1]} ${showPublishModal.year}`} draw results.
            This will make results public and create winner records. This cannot be undone.
          </p>
          {showPublishModal?.simulation_data && (
            <div className="p-3 bg-stone-800/50 rounded-xl text-sm">
              <div className="flex gap-2 mb-2">
                {(showPublishModal.simulation_data as any).numbers?.map((n: number, i: number) => (
                  <span key={i} className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {n}
                  </span>
                ))}
              </div>
              <p className="text-stone-400 text-xs">
                {(showPublishModal.simulation_data as any).five_match_winners} five-match ·
                {(showPublishModal.simulation_data as any).four_match_winners} four-match ·
                {(showPublishModal.simulation_data as any).three_match_winners} three-match
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPublishModal(null)}>Cancel</Button>
            <Button variant="gold" className="flex-1" loading={publishing} onClick={() => showPublishModal && handlePublish(showPublishModal)}>
              Publish Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
