import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, Trophy, CreditCard, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Score, UserCharity, Winner, MONTHS, formatCurrency } from '../../lib/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function DashboardOverview() {
  const { user, profile, subscription, isSubscribed } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null);
  const [recentWins, setRecentWins] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(5),
      supabase.from('user_charities').select('*, charity:charities(*)').eq('user_id', user.id).maybeSingle(),
      supabase.from('winners').select('*, draw:draws(month,year)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]).then(([scoresRes, charityRes, winsRes]) => {
      setScores(scoresRes.data ?? []);
      setUserCharity(charityRes.data);
      setRecentWins(winsRes.data ?? []);
    }).finally(() => setLoading(false));
  }, [user]);

  const totalWon = recentWins.reduce((sum, w) => sum + w.prize_amount, 0);
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
        <p className="text-stone-400 text-sm mt-1">Here's your performance snapshot</p>
      </div>

      {/* Subscription alert */}
      {!isSubscribed && (
        <div className="mb-6 p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl flex items-center gap-4">
          <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-warning-400 font-medium text-sm">No active subscription</p>
            <p className="text-stone-400 text-xs">Subscribe to enter monthly draws and support your charity.</p>
          </div>
          <Link to="/pricing">
            <Button size="sm" variant="gold">Subscribe Now</Button>
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Subscription */}
        <Link to="/dashboard/subscription" className="group">
          <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl hover:border-stone-600/60 transition-all group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-accent-500/15 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent-400" />
              </div>
              <Badge variant={isSubscribed ? 'success' : 'warning'}>
                {isSubscribed ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-stone-400 text-xs mb-1">Subscription</p>
            <p className="text-white font-bold capitalize">{subscription?.plan ?? 'None'}</p>
            {renewalDate && <p className="text-stone-500 text-xs mt-1">Renews {renewalDate}</p>}
          </div>
        </Link>

        {/* Scores */}
        <Link to="/dashboard/scores" className="group">
          <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl hover:border-stone-600/60 transition-all group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-primary-500/15 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-2xl font-bold text-primary-400">{scores.length}/5</span>
            </div>
            <p className="text-stone-400 text-xs mb-1">Scores Entered</p>
            {scores.length > 0 ? (
              <p className="text-white font-bold">Latest: {scores[0].score} pts</p>
            ) : (
              <p className="text-stone-500 text-sm">No scores yet</p>
            )}
          </div>
        </Link>

        {/* Charity */}
        <Link to="/dashboard/charity" className="group">
          <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl hover:border-stone-600/60 transition-all group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-error-500/15 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-error-400" />
              </div>
              <span className="text-sm font-bold text-error-400">
                {userCharity ? `${userCharity.contribution_percentage}%` : '—'}
              </span>
            </div>
            <p className="text-stone-400 text-xs mb-1">Charity</p>
            <p className="text-white font-bold text-sm truncate">
              {(userCharity as any)?.charity?.name ?? 'Not selected'}
            </p>
          </div>
        </Link>

        {/* Winnings */}
        <Link to="/dashboard/draws" className="group">
          <div className="p-5 bg-stone-900/60 border border-stone-700/40 rounded-2xl hover:border-stone-600/60 transition-all group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-secondary-500/15 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-secondary-400" />
              </div>
            </div>
            <p className="text-stone-400 text-xs mb-1">Total Won</p>
            <p className="text-secondary-400 font-bold text-xl">{formatCurrency(totalWon)}</p>
            {recentWins.length > 0 && (
              <p className="text-stone-500 text-xs mt-1">{recentWins.length} win{recentWins.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </Link>
      </div>

      {/* Recent scores */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" />
              Recent Scores
            </h3>
            <Link to="/dashboard/scores" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No scores entered yet</p>
              <Link to="/dashboard/scores" className="mt-3 inline-block">
                <Button size="sm" variant="outline">Add Score</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score, i) => (
                <div key={score.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 w-4">{i + 1}</span>
                    <div>
                      <span className="text-stone-300 text-sm">
                        {new Date(score.score_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{score.score}</span>
                    <span className="text-stone-500 text-xs">pts</span>
                    <TrendingUp className="w-3 h-3 text-primary-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent wins */}
        <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-secondary-400" />
              Recent Wins
            </h3>
            <Link to="/dashboard/draws" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentWins.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No wins yet — keep playing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWins.map(win => (
                <div key={win.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl">
                  <div>
                    <p className="text-stone-300 text-sm font-medium">
                      {win.match_tier}-Match Win
                    </p>
                    <p className="text-stone-500 text-xs">
                      {(win as any).draw ? `${MONTHS[(win as any).draw.month - 1]} ${(win as any).draw.year}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-secondary-400 font-bold">{formatCurrency(win.prize_amount)}</p>
                    <Badge variant={win.payment_status === 'paid' ? 'success' : win.payment_status === 'rejected' ? 'error' : 'warning'}>
                      {win.payment_status}
                    </Badge>
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
