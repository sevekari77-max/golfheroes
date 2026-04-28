import { Link } from 'react-router-dom';
import { Trophy, Heart, Twitter, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-stone-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">GolfHeroes</span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed">
              Where your game meets purpose. Play golf, win prizes, and change lives through charity.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: '/pricing', label: 'Pricing' },
                { to: '/draws', label: 'Draw Results' },
                { to: '/charities', label: 'Charities' },
                { to: '/dashboard', label: 'Dashboard' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-stone-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Impact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Impact</h4>
            <ul className="space-y-2">
              {[
                { to: '/charities', label: 'Partner Charities' },
                { to: '/charities', label: 'How It Works' },
                { to: '/draws', label: 'Winners' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="text-stone-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact'].map(label => (
                <li key={label}>
                  <a href="#" className="text-stone-400 hover:text-white text-sm transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} GolfHeroes. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-error-500 fill-error-500" />
            <span>for charity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
