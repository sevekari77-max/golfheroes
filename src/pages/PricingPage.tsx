import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Zap, Heart, Trophy, ArrowRight, Star } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PrizePoolConfig, formatCurrency } from '../lib/types';

export function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [config, setConfig] = useState<PrizePoolConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isSubscribed, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewUser = searchParams.get('newUser') === '1';

  useEffect(() => {
    supabase.from('prize_pool_config').select('*').maybeSingle().then(({ data }) => setConfig(data));
  }, []);

  const monthlyPrice = config?.monthly_price_pence ?? 999;
  const yearlyPrice = config?.yearly_price_pence ?? 9999;
  const yearlyMonthly = Math.round(yearlyPrice / 12);
  const savingPercent = Math.round((1 - yearlyMonthly / monthlyPrice) * 100);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    setLoading(true);
    try {
      // In production this would create a Stripe checkout session via edge function
      // For demo purposes we create a direct subscription record
      const price = plan === 'monthly' ? monthlyPrice : yearlyPrice;
      const now = new Date();
      const periodEnd = new Date(now);
      if (plan === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const { error } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan,
        status: 'active',
        amount_pence: price,
        currency: 'GBP',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      await refreshSubscription();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {isNewUser && (
            <div className="mb-8 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl text-center">
              <p className="text-primary-400 font-medium">Account created! Choose a plan to get started.</p>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-stone-400 text-lg max-w-xl mx-auto mb-8">
              One subscription. Monthly draws. Charity impact. Real prizes.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center bg-stone-900 border border-stone-700/50 rounded-xl p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billing === 'monthly'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billing === 'yearly'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="bg-secondary-500 text-stone-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  Save {savingPercent}%
                </span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className={`relative bg-stone-900/60 border rounded-2xl p-8 transition-all ${
              billing === 'monthly'
                ? 'border-primary-500/40 shadow-glow-green'
                : 'border-stone-700/40'
            }`}>
              {billing === 'monthly' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    SELECTED
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">Monthly</h3>
                <p className="text-stone-400 text-sm">Perfect for trying it out</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{formatCurrency(monthlyPrice)}</span>
                  <span className="text-stone-400">/month</span>
                </div>
              </div>
              <PlanFeatures />
              <Button
                size="lg"
                variant={billing === 'monthly' ? 'gold' : 'outline'}
                className="w-full mt-6"
                loading={loading && billing === 'monthly'}
                onClick={() => handleSubscribe('monthly')}
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                {isSubscribed ? 'Current Plan' : 'Get Started'}
              </Button>
            </div>

            {/* Yearly */}
            <div className={`relative bg-stone-900/60 border rounded-2xl p-8 transition-all ${
              billing === 'yearly'
                ? 'border-secondary-500/40 shadow-glow-gold'
                : 'border-stone-700/40'
            }`}>
              {billing === 'yearly' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-secondary-500 text-stone-900 text-xs font-bold px-3 py-1 rounded-full">
                    BEST VALUE
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">Yearly</h3>
                <p className="text-stone-400 text-sm">Commit and save big</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{formatCurrency(yearlyMonthly)}</span>
                  <span className="text-stone-400">/month</span>
                </div>
                <p className="text-stone-500 text-sm mt-1">Billed as {formatCurrency(yearlyPrice)}/year</p>
              </div>
              <PlanFeatures extra />
              <Button
                size="lg"
                variant={billing === 'yearly' ? 'gold' : 'outline'}
                className="w-full mt-6"
                loading={loading && billing === 'yearly'}
                onClick={() => handleSubscribe('yearly')}
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                {isSubscribed ? 'Upgrade Plan' : 'Get Best Value'}
              </Button>
            </div>
          </div>

          {/* Prize pool breakdown */}
          <div className="mt-16 bg-stone-900/40 border border-stone-700/40 rounded-2xl p-8">
            <h3 className="text-white font-bold text-xl mb-6 text-center">Where your subscription goes</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Trophy, label: 'Prize Pool', pct: `${config?.prize_pool_percentage ?? 60}%`, color: 'gold', desc: 'Monthly draws — 5, 4, 3 number matches' },
                { icon: Heart, label: 'Your Charity', pct: `${config?.charity_share_percentage ?? 10}%+`, color: 'error', desc: 'Minimum 10%, adjustable by you' },
                { icon: Zap, label: 'Platform', pct: `${100 - (config?.prize_pool_percentage ?? 60) - (config?.charity_share_percentage ?? 10)}%`, color: 'primary', desc: 'Operations and development' },
              ].map(({ icon: Icon, label, pct, color, desc }) => (
                <div key={label} className="text-center p-4 bg-stone-800/40 rounded-xl">
                  <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    color === 'gold' ? 'bg-secondary-500/20' :
                    color === 'error' ? 'bg-error-500/20' : 'bg-primary-500/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      color === 'gold' ? 'text-secondary-400' :
                      color === 'error' ? 'text-error-400' : 'text-primary-400'
                    }`} />
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${
                    color === 'gold' ? 'text-secondary-400' :
                    color === 'error' ? 'text-error-400' : 'text-primary-400'
                  }`}>{pct}</div>
                  <div className="text-white font-medium text-sm mb-1">{label}</div>
                  <div className="text-stone-500 text-xs">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-stone-500 text-sm mt-8">
            All payments secured by Stripe. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </Layout>
  );
}

function PlanFeatures({ extra = false }: { extra?: boolean }) {
  const features = [
    { icon: Zap, text: 'Enter all monthly draws' },
    { icon: Trophy, text: 'Win cash prizes' },
    { icon: Heart, text: '10% goes to your charity' },
    { icon: Star, text: 'Score tracking (last 5)' },
    ...(extra ? [{ icon: CheckCircle2, text: 'Priority support' }] : []),
  ];
  return (
    <ul className="space-y-2.5">
      {features.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-sm text-stone-300">
          <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
          {text}
        </li>
      ))}
    </ul>
  );
}
