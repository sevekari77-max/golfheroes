import { useEffect, useState } from 'react';
import { Trophy, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Winner, Draw, MONTHS, formatCurrency } from '../../lib/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export function DrawsWinsPage() {
  const { user } = useAuth();
  const [wins, setWins] = useState<(Winner & { draw: Draw })[]>([]);
  const [recentDraws, setRecentDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<Winner | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchData = async () => {
    if (!user) return;
    const [winsRes, drawsRes] = await Promise.all([
      supabase.from('winners').select('*, draw:draws(*), verification:winner_verifications(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('draws').select('*, draw_numbers(*)').eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false }).limit(6),
    ]);
    setWins(winsRes.data ?? []);
    setRecentDraws(drawsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmitProof = async () => {
    if (!proofUrl.trim() || !uploadModal) return;
    setUploadError('');
    setUploading(true);
    try {
      const { error } = await supabase.from('winner_verifications').insert({
        winner_id: uploadModal.id,
        user_id: user!.id,
        proof_url: proofUrl.trim(),
        status: 'pending',
      });
      if (error) throw error;
      await fetchData();
      setUploadModal(null);
      setProofUrl('');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setUploading(false);
    }
  };

  const totalWon = wins.reduce((sum, w) => sum + w.prize_amount, 0);
  const pendingVerification = wins.filter(w => !(w as any).verification && w.payment_status === 'pending');

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Draws & Wins</h1>
        <p className="text-stone-400 text-sm mt-1">Your draw participation and winnings overview</p>
      </div>

      {/* Win stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl text-center">
          <p className="text-2xl font-bold text-secondary-400">{formatCurrency(totalWon)}</p>
          <p className="text-stone-400 text-xs mt-1">Total Won</p>
        </div>
        <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl text-center">
          <p className="text-2xl font-bold text-white">{wins.length}</p>
          <p className="text-stone-400 text-xs mt-1">Total Wins</p>
        </div>
        <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl text-center">
          <p className="text-2xl font-bold text-primary-400">
            {wins.filter(w => w.payment_status === 'paid').length}
          </p>
          <p className="text-stone-400 text-xs mt-1">Paid Out</p>
        </div>
      </div>

      {/* Pending verification alert */}
      {pendingVerification.length > 0 && (
        <div className="mb-6 p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-warning-400 font-medium text-sm">
              {pendingVerification.length} win{pendingVerification.length !== 1 ? 's' : ''} awaiting proof upload
            </p>
            <p className="text-stone-400 text-xs">Upload your score screenshot to claim your prize.</p>
          </div>
        </div>
      )}

      {/* My wins */}
      <div className="mb-8">
        <h2 className="text-white font-semibold mb-4">My Wins</h2>
        {wins.length === 0 ? (
          <div className="py-12 text-center bg-stone-900/40 border border-stone-700/30 rounded-2xl">
            <Trophy className="w-12 h-12 text-stone-600 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">No wins yet</p>
            <p className="text-stone-400 text-sm">Keep entering scores and participating in monthly draws!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wins.map(win => {
              const verification = (win as any).verification?.[0];
              return (
                <div key={win.id} className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          win.match_tier === 5 ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/30' :
                          win.match_tier === 4 ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' :
                          'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                        }`}>
                          {win.match_tier}-Number Match
                        </div>
                        <Badge variant={
                          win.payment_status === 'paid' ? 'success' :
                          win.payment_status === 'rejected' ? 'error' : 'warning'
                        }>
                          {win.payment_status}
                        </Badge>
                      </div>
                      <p className="text-white font-bold text-xl">{formatCurrency(win.prize_amount)}</p>
                      {win.draw && (
                        <p className="text-stone-400 text-sm mt-1">
                          {MONTHS[win.draw.month - 1]} {win.draw.year} Draw
                        </p>
                      )}
                      {win.matched_numbers.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {win.matched_numbers.map(n => (
                            <span key={n} className="w-7 h-7 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center text-primary-300 text-xs font-bold">
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      {!verification && win.payment_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="gold"
                          icon={<Upload className="w-3.5 h-3.5" />}
                          onClick={() => setUploadModal(win)}
                        >
                          Upload Proof
                        </Button>
                      )}
                      {verification && (
                        <div className="text-right">
                          <Badge variant={
                            verification.status === 'approved' ? 'success' :
                            verification.status === 'rejected' ? 'error' : 'info'
                          }>
                            Proof: {verification.status}
                          </Badge>
                          {verification.admin_notes && (
                            <p className="text-stone-500 text-xs mt-1 max-w-48">{verification.admin_notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent public draws */}
      <div>
        <h2 className="text-white font-semibold mb-4">Recent Draws</h2>
        <div className="space-y-3">
          {recentDraws.map(draw => (
            <div key={draw.id} className="p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{MONTHS[draw.month - 1]} {draw.year}</p>
                  <p className="text-stone-400 text-xs">Prize pool: {formatCurrency(draw.prize_pool_total)}</p>
                </div>
                <div className="flex gap-2">
                  {(draw as any).draw_numbers?.map((dn: any) => (
                    <span key={dn.id} className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {dn.number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {recentDraws.length === 0 && (
            <p className="text-stone-500 text-sm text-center py-8">No published draws yet.</p>
          )}
        </div>
      </div>

      {/* Proof upload modal */}
      <Modal isOpen={!!uploadModal} onClose={() => setUploadModal(null)} title="Upload Proof of Score">
        <div className="space-y-4">
          <div className="p-3 bg-accent-500/10 border border-accent-500/20 rounded-xl">
            <p className="text-accent-300 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Upload a screenshot URL from your official golf platform showing your scores. An admin will review and approve your win within 48 hours.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">Screenshot URL</label>
            <input
              type="url"
              value={proofUrl}
              onChange={e => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          {uploadError && (
            <p className="text-error-400 text-sm">{uploadError}</p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setUploadModal(null)}>Cancel</Button>
            <Button className="flex-1" loading={uploading} onClick={handleSubmitProof}>Submit Proof</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
