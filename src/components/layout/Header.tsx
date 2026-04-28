import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Trophy, Heart, Zap, User, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function Header() {
  const { user, profile, isAdmin, isSubscribed, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setProfileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-500 transition-colors">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">GolfHeroes</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/charities"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-primary-400 bg-primary-500/10' : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Heart className="w-4 h-4" />
              Charities
            </NavLink>
            <NavLink
              to="/draws"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-primary-400 bg-primary-500/10' : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Zap className="w-4 h-4" />
              Draws
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-primary-400 bg-primary-500/10' : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              Pricing
            </NavLink>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-600/30 border border-primary-500/40 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary-400" />
                  </div>
                  <span className="hidden sm:block text-sm text-stone-300 max-w-[120px] truncate">
                    {profile?.full_name || 'Account'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-stone-900 border border-stone-700/50 rounded-xl shadow-2xl z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-700/50">
                        <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-stone-400 truncate">{profile?.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary-400 hover:text-secondary-300 hover:bg-white/5 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/pricing">
                  <Button size="sm" variant="gold">Join Now</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/5"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-800/50 bg-stone-950/95 backdrop-blur-md">
          <nav className="px-4 py-3 space-y-1">
            <MobileNavLink to="/charities" onClick={() => setMenuOpen(false)}>
              <Heart className="w-4 h-4" /> Charities
            </MobileNavLink>
            <MobileNavLink to="/draws" onClick={() => setMenuOpen(false)}>
              <Zap className="w-4 h-4" /> Draw Results
            </MobileNavLink>
            <MobileNavLink to="/pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </MobileNavLink>
            {user ? (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </MobileNavLink>
                {isAdmin && (
                  <MobileNavLink to="/admin" onClick={() => setMenuOpen(false)}>
                    <Settings className="w-4 h-4" /> Admin Panel
                  </MobileNavLink>
                )}
              </>
            ) : (
              <MobileNavLink to="/auth" onClick={() => setMenuOpen(false)}>
                Sign In
              </MobileNavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'text-primary-400 bg-primary-500/10' : 'text-stone-300 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
