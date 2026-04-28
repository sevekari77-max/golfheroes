import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Heart, Trophy, BarChart2, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { Header } from '../../components/layout/Header';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/draws', icon: Zap, label: 'Draws' },
  { to: '/admin/charities', icon: Heart, label: 'Charities' },
  { to: '/admin/winners', icon: Trophy, label: 'Winners' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
];

export function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/dashboard');
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) return null;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-stone-950">
      <Header />
      <div className="pt-16 flex">
        {/* Admin sidebar */}
        <aside className="hidden md:flex flex-col w-56 fixed top-16 left-0 bottom-0 bg-stone-900/80 border-r border-stone-800/50 p-3">
          <div className="mb-4 px-2 py-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-secondary-400" />
              <span className="text-secondary-400 text-xs font-bold uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/20'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-500 hover:text-stone-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to User Panel
          </NavLink>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800/50 flex">
          {navItems.slice(0, 6).map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                  isActive ? 'text-secondary-400' : 'text-stone-600'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px]">{label}</span>
            </NavLink>
          ))}
        </div>

        <main className="flex-1 md:ml-56 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
