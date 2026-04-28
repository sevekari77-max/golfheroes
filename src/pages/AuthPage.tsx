import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Trophy, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

type Mode = 'login' | 'signup';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') setMode('signup');
  }, [searchParams]);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('Full name is required');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            full_name: fullName.trim(),
            role: 'subscriber',
          });
          if (profileError && !profileError.message.includes('duplicate')) throw profileError;
        }

        navigate('/pricing?newUser=1');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg.includes('Invalid login') ? 'Invalid email or password' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-950 via-stone-950 to-secondary-950/30">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }}
        />
        <div className="relative flex flex-col justify-center px-16 py-12">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl">GolfHeroes</span>
          </Link>

          <div className="max-w-sm">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Your game,<br />
              <span className="text-primary-400">bigger purpose.</span>
            </h2>
            <p className="text-stone-400 text-lg leading-relaxed mb-8">
              Track scores, win prizes, fund charities. Join a community of golfers making every round count.
            </p>

            <div className="space-y-4">
              {[
                'Monthly prize draws from subscriber pool',
                '10% minimum goes to your chosen charity',
                'Clean Stableford score tracking',
                'Jackpot rolls over when unclaimed',
              ].map(feat => (
                <div key={feat} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 bg-primary-400 rounded-full" />
                  </div>
                  <span className="text-stone-300 text-sm">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">GolfHeroes</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-stone-400 text-sm mb-8">
            {mode === 'login'
              ? 'Sign in to access your dashboard'
              : 'Join the community — it only takes a minute'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                  required
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-xl">
                <p className="text-error-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              variant="gold"
              loading={loading}
              className="w-full mt-2"
              iconRight={<ArrowRight className="w-5 h-5" />}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-stone-400 text-sm">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>

          {mode === 'login' && (
            <p className="text-center mt-3 text-stone-600 text-xs">
              Admin demo: admin@golfheroes.com / admin1234
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
