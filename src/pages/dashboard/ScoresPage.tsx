import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Target, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Score } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export function ScoresPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editScore, setEditScore] = useState<Score | null>(null);
  const [formScore, setFormScore] = useState('');
  const [formDate, setFormDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchScores = async (uid?: string) => {
    const userId = uid ?? user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false });
    setScores(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchScores(user.id);
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const openAdd = () => {
    setEditScore(null);
    setFormScore('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (score: Score) => {
    setEditScore(score);
    setFormScore(String(score.score));
    setFormDate(score.score_date);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    const scoreNum = parseInt(formScore);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      setError('Score must be between 1 and 45');
      return;
    }
    if (!formDate) {
      setError('Date is required');
      return;
    }

    setSaving(true);
    try {
      // Always refetch before checking duplicates to ensure state is in sync with DB
      if (!user) return;
      const { data: freshScores } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('score_date', { ascending: false });
      const current = freshScores ?? [];

      const duplicate = current.find(s =>
        s.score_date === formDate && s.id !== editScore?.id
      );
      if (duplicate) {
        setScores(current);
        setError('A score for this date already exists. Edit or delete it first.');
        setSaving(false);
        return;
      }

      if (editScore) {
        const { error } = await supabase.from('scores').update({
          score: scoreNum,
          score_date: formDate,
          updated_at: new Date().toISOString(),
        }).eq('id', editScore.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('scores').insert({
          user_id: user.id,
          score: scoreNum,
          score_date: formDate,
        });
        if (error) throw error;
      }
      await fetchScores(user.id);
      setShowModal(false);
    } catch (err: unknown) {
      // Always resync scores on any error so stale state can't cause phantom duplicates
      await fetchScores(user.id);
      const msg = (err as any)?.message || (err as any)?.details || (err instanceof Error ? err.message : '');
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
        setError('A score for this date already exists.');
      } else {
        setError(msg || 'Failed to save score. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id);
    setDeleteId(null);
    if (user?.id) fetchScores(user.id);
  };

  const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Scores</h1>
          <p className="text-stone-400 text-sm mt-1">Track your last 5 Stableford scores</p>
        </div>
        {scores.length < 5 && (
          <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>
            Add Score
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-accent-300 text-sm font-medium">Rolling 5-Score Window</p>
          <p className="text-stone-400 text-sm">
            Only your last 5 scores are kept. Adding a 6th score automatically removes the oldest.
            Scores must be between 1–45 and each date can only have one entry.
          </p>
        </div>
      </div>

      {/* Stats */}
      {scores.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Scores entered', value: `${scores.length}/5`, color: 'primary' },
            { label: 'Best score', value: `${maxScore} pts`, color: 'gold' },
            { label: 'Average', value: `${avgScore} pts`, color: 'accent' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl text-center">
              <p className={`text-xl font-bold ${
                color === 'primary' ? 'text-primary-400' :
                color === 'gold' ? 'text-secondary-400' : 'text-accent-400'
              }`}>{value}</p>
              <p className="text-stone-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scores list */}
      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading scores...</div>
      ) : scores.length === 0 ? (
        <div className="py-16 text-center bg-stone-900/40 border border-stone-700/30 rounded-2xl">
          <Target className="w-12 h-12 text-stone-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No scores yet</h3>
          <p className="text-stone-400 text-sm mb-6">Add your first Stableford score to enter monthly draws</p>
          <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>
            Add First Score
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score, idx) => (
            <div
              key={score.id}
              className="flex items-center justify-between p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl hover:border-stone-600/60 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center text-stone-500 text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {new Date(score.score_date).toLocaleDateString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  {idx === 0 && (
                    <Badge variant="success">Most Recent</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{score.score}</span>
                  <span className="text-stone-400 text-sm ml-1">pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(score)}
                    className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(score.id)}
                    className="p-2 rounded-lg text-stone-400 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add more prompt when < 5 */}
          {scores.length < 5 && (
            <button
              onClick={openAdd}
              className="w-full p-4 border-2 border-dashed border-stone-700/50 rounded-xl text-stone-500 hover:text-stone-300 hover:border-stone-600 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add another score ({5 - scores.length} slot{5 - scores.length !== 1 ? 's' : ''} remaining)
            </button>
          )}

          {scores.length >= 5 && (
            <div className="p-3 bg-stone-900/40 border border-stone-700/30 rounded-xl text-center">
              <p className="text-stone-500 text-xs">Maximum 5 scores reached. Adding a new score will replace the oldest.</p>
              <Button onClick={openAdd} size="sm" variant="outline" className="mt-2" icon={<Plus className="w-3 h-3" />}>
                Replace Oldest
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editScore ? 'Edit Score' : 'Add Score'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Stableford Score <span className="text-stone-500">(1–45)</span>
            </label>
            <input
              type="number"
              min="1"
              max="45"
              value={formScore}
              onChange={e => setFormScore(e.target.value)}
              placeholder="e.g. 32"
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Date Played
            </label>
            <input
              type="date"
              value={formDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setFormDate(e.target.value)}
              className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error-500/10 border border-error-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-error-400 flex-shrink-0" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editScore ? 'Update Score' : 'Save Score'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Score">
        <p className="text-stone-300 mb-6">Are you sure you want to delete this score? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
