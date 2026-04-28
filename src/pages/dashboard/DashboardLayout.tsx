import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, Heart, Trophy, CreditCard, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { useEffect } from 'react';
import { formatCurrency } from '../../lib/types';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/scores', icon: Target, label: 'My Scores' },
  { to: '/dashboard/charity', icon: Heart, label: 'My Charity' },
  { to: '/dashboard/draws', icon: Trophy, label: 'Draws & Wins' },
  { to: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

export function DashboardLayout() {
  const { user, profile, subscription, isSubscribed, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-stone-950">
      <Header />
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 fixed top-16 left-0 bottom-0 bg-stone-900/50 border-r border-stone-800/50 p-4">
          {/* User info */}
          <div className="mb-6 p-3 bg-stone-800/50 rounded-xl">
            <p className="text-white font-medium text-sm truncate">{profile?.full_name || 'User'}</p>
            <p className="text-stone-400 text-xs truncate mb-2">{profile?.email}</p>
            {isSubscribed ? (
              <Badge variant="success">Active Subscriber</Badge>
            ) : (
              <Badge variant="warning">No Subscription</Badge>
            )}
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Subscription card */}
          {isSubscribed && subscription && (
            <div className="mt-4 p-3 bg-primary-900/30 border border-primary-700/30 rounded-xl">
              <p className="text-xs text-stone-400 mb-1">Current plan</p>
              <p className="text-white text-sm font-semibold capitalize">{subscription.plan}</p>
              <p className="text-primary-400 text-xs mt-1">
                {formatCurrency(subscription.amount_pence)}/{subscription.plan === 'monthly' ? 'mo' : 'yr'}
              </p>
            </div>
          )}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800/50 flex">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                  isActive ? 'text-primary-400' : 'text-stone-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
