import { useEffect, useState } from 'react';
import { Trophy, CheckCircle2, XCircle, Eye, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MONTHS, formatCurrency } from '../../lib/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export function AdminWinners() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('all');
  const [viewWinner, setViewWinner] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWinners = async () => {
    const { data } = await supabase
      .from('winners')
      .select('*, profile:profiles(*), draw:draws(*), verification:winner_verifications(*)')
      .order('created_at', { ascending: false });
    setWinners(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchWinners(); }, []);

  const filtered = winners.filter(w =>
    filter === 'all' ? true : w.payment_status === filter
  );

  const handleReviewVerification = async (
    verificationId: string,
    winnerId: string,
    action: 'approved' | 'rejected'
  ) => {
    setProcessing(true);
    try {
      await supabase.from('winner_verifications').update({
        status: action,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', verificationId);

      if (action === 'approved') {
        await supabase.from('winners').update({ payment_status: 'paid', updated_at: new Date().toISOString() }).eq('id', winnerId);
      } else {
        await supabase.from('winners').update({ payment_status: 'rejected', updated_at: new Date().toISOString() }).eq('id', winnerId);
      }
      await fetchWinners();
      setViewWinner(null);
      setAdminNotes('');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async (winnerId: string) => {
    await supabase.from('winners').update({ payment_status: 'paid', updated_at: new Date().toISOString() }).eq('id', winnerId);
    fetchWinners();
  };

  const stats = {
    total: winners.length,
    pending: winners.filter(w => w.payment_status === 'pending').length,
    paid: winners.filter(w => w.payment_status === 'paid').length,
    totalPrize: winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0),
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Winners Management</h1>
        <p className="text-stone-400 text-sm mt-1">Verify submissions and manage payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'neutral' },
          { label: 'Pending', value: stats.pending, color: stats.pending > 0 ? 'warning' : 'neutral' },
          { label: 'Paid', value: stats.paid, color: 'success' },
          { label: 'Paid Out', value: formatCurrency(stats.totalPrize), color: 'gold' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`p-4 bg-stone-900/60 border rounded-xl text-center ${
            color === 'warning' ? 'border-warning-500/30' : 'border-stone-700/40'
          }`}>
            <p className={`font-bold text-lg ${
              color === 'warning' ? 'text-warning-400' :
              color === 'success' ? 'text-success-500' :
              color === 'gold' ? 'text-secondary-400' : 'text-white'
            }`}>{value}</p>
            <p className="text-stone-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'paid', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            {f} {f !== 'all' && <span className="ml-1 text-xs opacity-70">({winners.filter(w => w.payment_status === f).length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading winners...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(winner => {
            const verification = winner.verification?.[0];
            return (
              <div key={winner.id} className="p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl hover:border-stone-600/60 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      winner.match_tier === 5 ? 'bg-secondary-500/20' :
                      winner.match_tier === 4 ? 'bg-primary-500/20' : 'bg-accent-500/20'
                    }`}>
                      <Trophy className={`w-4 h-4 ${
                        winner.match_tier === 5 ? 'text-secondary-400' :
                        winner.match_tier === 4 ? 'text-primary-400' : 'text-accent-400'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-medium text-sm">{winner.profile?.full_name ?? 'Unknown'}</p>
                        <Badge variant={
                          winner.payment_status === 'paid' ? 'success' :
                          winner.payment_status === 'rejected' ? 'error' : 'warning'
                        }>
                          {winner.payment_status}
                        </Badge>
                      </div>
                      <p className="text-stone-400 text-xs">
                        {winner.match_tier}-Match · {winner.draw ? `${MONTHS[winner.draw.month - 1]} ${winner.draw.year}` : ''}
                        {' · '}{winner.profile?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-secondary-400 font-bold">{formatCurrency(winner.prize_amount)}</p>
                    {verification ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { setViewWinner(winner); setAdminNotes(verification.admin_notes ?? ''); }}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Review
                      </Button>
                    ) : winner.payment_status === 'pending' ? (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleMarkPaid(winner.id)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Mark Paid
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-stone-500">No winners found</div>
          )}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={!!viewWinner} onClose={() => setViewWinner(null)} title="Verify Winner">
        {viewWinner && (
          <div className="space-y-4">
            <div className="p-3 bg-stone-800/50 rounded-xl">
              <p className="text-white font-medium">{viewWinner.profile?.full_name}</p>
              <p className="text-stone-400 text-sm">{viewWinner.match_tier}-Match · {formatCurrency(viewWinner.prize_amount)}</p>
              <div className="flex gap-1 mt-2">
                {viewWinner.matched_numbers?.map((n: number) => (
                  <span key={n} className="w-7 h-7 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center text-primary-300 text-xs font-bold">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {viewWinner.verification?.[0] && (
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Submitted Proof</label>
                <a
                  href={viewWinner.verification[0].proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-stone-800/50 border border-stone-600/50 rounded-xl text-accent-400 hover:text-accent-300 text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Proof Document
                </a>
                <Badge variant={
                  viewWinner.verification[0].status === 'approved' ? 'success' :
                  viewWinner.verification[0].status === 'rejected' ? 'error' : 'warning'
                } className="mt-2">
                  {viewWinner.verification[0].status}
                </Badge>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Optional notes for the winner..."
                rows={2}
                className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none"
              />
            </div>

            {viewWinner.verification?.[0]?.status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={processing}
                  onClick={() => handleReviewVerification(viewWinner.verification[0].id, viewWinner.id, 'rejected')}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={processing}
                  onClick={() => handleReviewVerification(viewWinner.verification[0].id, viewWinner.id, 'approved')}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve & Pay
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
