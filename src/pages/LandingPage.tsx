import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Trophy, Zap, Star, Shield, Users, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Charity } from '../lib/types';
import { formatCurrency } from '../lib/types';

export function LandingPage() {
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [stats, setStats] = useState({ users: 0, raised: 0, winners: 0 });

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setFeaturedCharity(data));

    // Aggregate stats
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('subscriptions').select('amount_pence').eq('status', 'active'),
      supabase.from('winners').select('id', { count: 'exact' }),
    ]).then(([usersRes, subsRes, winnersRes]) => {
      const totalRaised = (subsRes.data ?? []).reduce((a, s) => a + s.amount_pence * 0.1, 0);
      setStats({
        users: usersRes.count ?? 0,
        raised: Math.round(totalRaised),
        winners: winnersRes.count ?? 0,
      });
    });
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-primary-950/30 to-stone-950" />
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-8">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-slow" />
              <span className="text-primary-400 text-sm font-medium">Now live — Monthly draws every month</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
              Play golf.
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Win prizes.
              </span>
              <br />
              Change lives.
            </h1>

            <p className="text-xl text-stone-300 leading-relaxed max-w-2xl mx-auto mb-10">
              Every month, your golf scores enter you into a prize draw. A portion of every subscription goes
              directly to the charity you choose. One platform. Real impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/pricing">
                <Button size="xl" variant="gold" iconRight={<ArrowRight className="w-5 h-5" />}>
                  Start Your Journey
                </Button>
              </Link>
              <Link to="/charities">
                <Button size="xl" variant="ghost" icon={<Heart className="w-5 h-5 text-error-400" />}>
                  Explore Charities
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
              {[
                { icon: Shield, label: 'PCI-Compliant Payments' },
                { icon: Users, label: `${stats.users || '100'}+ Members` },
                { icon: Heart, label: `${formatCurrency(stats.raised || 5000)} Raised` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-stone-400 text-sm">
                  <Icon className="w-4 h-4 text-primary-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Three steps to make a difference
            </h2>
            <p className="text-stone-400 text-lg max-w-2xl mx-auto">
              We've removed the complexity. Play your usual game, and let us handle the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(33.3%+2rem)] right-[calc(33.3%+2rem)] h-0.5 bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20" />

            {[
              {
                step: '01',
                icon: Trophy,
                color: 'primary',
                title: 'Enter your scores',
                desc: 'Log your last 5 Stableford scores. Our system keeps only your most recent results — clean and simple.',
              },
              {
                step: '02',
                icon: Zap,
                color: 'secondary',
                title: 'Enter the draw',
                desc: 'Your scores automatically enter you into each month\'s prize draw. Match 3, 4, or all 5 numbers to win.',
              },
              {
                step: '03',
                icon: Heart,
                color: 'error',
                title: 'Fund your charity',
                desc: 'Minimum 10% of your subscription goes directly to your chosen charity. You control the percentage.',
              },
            ].map(({ step, icon: Icon, color, title, desc }) => (
              <div key={step} className="relative group">
                <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-8 h-full hover:border-stone-600/60 transition-all hover:-translate-y-1 hover:shadow-card-hover">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      color === 'primary' ? 'bg-primary-500/20 border border-primary-500/30' :
                      color === 'secondary' ? 'bg-secondary-500/20 border border-secondary-500/30' :
                      'bg-error-500/20 border border-error-500/30'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        color === 'primary' ? 'text-primary-400' :
                        color === 'secondary' ? 'text-secondary-400' :
                        'text-error-400'
                      }`} />
                    </div>
                    <span className="text-4xl font-bold text-stone-800">{step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                  <p className="text-stone-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE POOL */}
      <section className="py-24 bg-gradient-to-b from-stone-950 via-stone-900/50 to-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-500/10 border border-secondary-500/20 rounded-full mb-6">
                <Trophy className="w-4 h-4 text-secondary-400" />
                <span className="text-secondary-400 text-sm font-medium">Prize Pool System</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Real money. Real winners. Every month.
              </h2>
              <p className="text-stone-400 text-lg mb-8 leading-relaxed">
                A portion of every subscription feeds directly into the monthly prize pool. Match more numbers, win a larger share. The 5-match jackpot rolls over if unclaimed.
              </p>
              <div className="space-y-4">
                {[
                  { matches: '5 numbers matched', share: '40% of pool', note: 'Jackpot — rolls over if unclaimed', color: 'gold' },
                  { matches: '4 numbers matched', share: '35% of pool', note: 'Split equally among winners', color: 'primary' },
                  { matches: '3 numbers matched', share: '25% of pool', note: 'Split equally among winners', color: 'accent' },
                ].map(({ matches, share, note, color }) => (
                  <div key={matches} className="flex items-start gap-4 p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      color === 'gold' ? 'bg-secondary-500/20 border border-secondary-500/30' :
                      color === 'primary' ? 'bg-primary-500/20 border border-primary-500/30' :
                      'bg-accent-500/20 border border-accent-500/30'
                    }`}>
                      <Star className={`w-5 h-5 ${
                        color === 'gold' ? 'text-secondary-400' :
                        color === 'primary' ? 'text-primary-400' :
                        'text-accent-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-semibold">{matches}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                          color === 'gold' ? 'bg-secondary-500/20 text-secondary-400' :
                          color === 'primary' ? 'bg-primary-500/20 text-primary-400' :
                          'bg-accent-500/20 text-accent-400'
                        }`}>{share}</span>
                      </div>
                      <p className="text-stone-400 text-sm">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-3xl" />
              <div className="relative bg-stone-900/80 border border-stone-700/40 rounded-3xl p-8">
                <div className="text-center mb-8">
                  <p className="text-stone-400 text-sm mb-2">This month's estimated prize pool</p>
                  <div className="text-5xl font-bold text-white">
                    {formatCurrency(Math.max(stats.users * 999 * 0.6, 15000))}
                  </div>
                  <p className="text-primary-400 text-sm mt-2">Growing with every subscriber</p>
                </div>
                <div className="space-y-3">
                  {[
                    { tier: '5-Match Jackpot', amount: Math.max(stats.users * 999 * 0.6 * 0.4, 6000), color: 'gold' },
                    { tier: '4-Match Prize', amount: Math.max(stats.users * 999 * 0.6 * 0.35, 5250), color: 'primary' },
                    { tier: '3-Match Prize', amount: Math.max(stats.users * 999 * 0.6 * 0.25, 3750), color: 'accent' },
                  ].map(({ tier, amount, color }) => (
                    <div key={tier} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-xl">
                      <span className="text-stone-300 text-sm">{tier}</span>
                      <span className={`font-bold text-sm ${
                        color === 'gold' ? 'text-secondary-400' :
                        color === 'primary' ? 'text-primary-400' :
                        'text-accent-400'
                      }`}>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
                <Link to="/pricing" className="block mt-6">
                  <Button size="lg" variant="gold" className="w-full" iconRight={<ChevronRight className="w-5 h-5" />}>
                    Join to Participate
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CHARITY */}
      {featuredCharity && (
        <section className="py-24 bg-stone-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-error-500/10 border border-error-500/20 rounded-full mb-4">
                <Heart className="w-4 h-4 text-error-400 fill-error-400" />
                <span className="text-error-400 text-sm font-medium">Featured Charity</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                This month we're spotlighting
              </h2>
            </div>

            <div className="max-w-4xl mx-auto bg-stone-900/60 border border-stone-700/40 rounded-3xl overflow-hidden">
              {featuredCharity.cover_image_url && (
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={featuredCharity.cover_image_url}
                    alt={featuredCharity.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-3">{featuredCharity.name}</h3>
                <p className="text-stone-400 leading-relaxed mb-6">{featuredCharity.short_description}</p>
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <p className="text-stone-500 text-sm">Total Raised</p>
                    <p className="text-primary-400 font-bold text-xl">{formatCurrency(featuredCharity.total_raised)}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-sm">Supporters</p>
                    <p className="text-white font-bold text-xl">{featuredCharity.supporter_count.toLocaleString()}</p>
                  </div>
                </div>
                <Link to={`/charities/${featuredCharity.slug}`}>
                  <Button variant="outline" iconRight={<ArrowRight className="w-4 h-4" />}>
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="py-24 bg-stone-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need</h2>
            <p className="text-stone-400 text-lg max-w-xl mx-auto">Built for golfers who want their game to mean something more.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Score Tracking', desc: 'Log your last 5 Stableford scores. Auto-rolling window keeps things current.' },
              { icon: Zap, title: 'Monthly Draws', desc: 'Automated draws every month. Match 3, 4, or 5 numbers to claim prizes.' },
              { icon: Heart, title: 'Charity Impact', desc: 'Choose your charity. Set your percentage. Minimum 10%. Maximum generosity.' },
              { icon: Trophy, title: 'Prize Pool', desc: 'Real cash prizes pooled from subscribers. Jackpot rolls over when unclaimed.' },
              { icon: Shield, title: 'Verified Payments', desc: 'Winner verification system with proof upload and admin approval.' },
              { icon: Users, title: 'Community', desc: 'Join a growing community of golfers making a positive difference.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 bg-stone-900/60 border border-stone-700/40 rounded-2xl hover:border-stone-600/60 transition-all group">
                <div className="w-10 h-10 bg-primary-500/15 border border-primary-500/25 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/25 transition-colors">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-stone-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative bg-gradient-to-br from-primary-900/40 to-stone-900/80 border border-primary-700/30 rounded-3xl p-12">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 opacity-20 -translate-y-1/2"
              style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
                Ready to play with purpose?
              </h2>
              <p className="text-stone-300 text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of golfers already making their game count. Start your monthly or yearly subscription today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/pricing">
                  <Button size="xl" variant="gold" iconRight={<ArrowRight className="w-5 h-5" />}>
                    Get Started — From £9.99/mo
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                {['Cancel anytime', 'Instant access', 'Charity impact from day one'].map(feat => (
                  <div key={feat} className="flex items-center gap-2 text-stone-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary-500" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
