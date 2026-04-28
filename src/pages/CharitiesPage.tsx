import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Users, TrendingUp, Star } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { Charity, formatCurrency } from '../lib/types';

const CATEGORIES = ['all', 'health', 'children', 'community', 'animals', 'education', 'general'];

export function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('total_raised', { ascending: false })
      .then(({ data }) => {
        setCharities(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.short_description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || c.category === category;
    return matchSearch && matchCat;
  });

  const featured = charities.find(c => c.is_featured);
  const totalRaised = charities.reduce((s, c) => s + c.total_raised, 0);
  const totalSupporters = charities.reduce((s, c) => s + c.supporter_count, 0);

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-error-500/10 border border-error-500/20 rounded-full mb-4">
            <Heart className="w-4 h-4 text-error-400 fill-error-400" />
            <span className="text-error-400 text-sm font-medium">Charity Directory</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose your cause
          </h1>
          <p className="text-stone-400 text-lg max-w-xl mx-auto mb-8">
            Every subscription includes a direct donation to your chosen charity. Browse our verified partner charities below.
          </p>
          <div className="flex justify-center gap-8">
            {[
              { icon: TrendingUp, label: 'Total Raised', value: formatCurrency(totalRaised) },
              { icon: Users, label: 'Supporters', value: totalSupporters.toLocaleString() },
              { icon: Heart, label: 'Charities', value: charities.length },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon className="w-4 h-4 text-primary-400" />
                  <span className="text-stone-400 text-sm">{label}</span>
                </div>
                <p className="text-white font-bold text-lg">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured */}
        {featured && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-secondary-400 fill-secondary-400" />
              <span className="text-secondary-400 font-medium text-sm">Spotlight Charity</span>
            </div>
            <Link to={`/charities/${featured.slug}`}>
              <div className="group relative overflow-hidden bg-stone-900/60 border border-secondary-700/30 rounded-2xl hover:border-secondary-600/40 transition-all">
                {featured.cover_image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={featured.cover_image_url}
                      alt={featured.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-transparent" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs px-2 py-0.5 bg-secondary-500/20 text-secondary-400 rounded-full mb-2 inline-block">FEATURED</span>
                      <h3 className="text-2xl font-bold text-white mb-2">{featured.name}</h3>
                      <p className="text-stone-400">{featured.short_description}</p>
                      <div className="flex gap-6 mt-4">
                        <div>
                          <p className="text-stone-500 text-xs">Raised</p>
                          <p className="text-primary-400 font-bold">{formatCurrency(featured.total_raised)}</p>
                        </div>
                        <div>
                          <p className="text-stone-500 text-xs">Supporters</p>
                          <p className="text-white font-bold">{featured.supporter_count.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    {featured.logo_url && (
                      <img src={featured.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search charities..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center text-stone-500">Loading charities...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(charity => (
              <Link key={charity.id} to={`/charities/${charity.slug}`}>
                <div className="group bg-stone-900/60 border border-stone-700/40 rounded-2xl overflow-hidden hover:border-stone-600/60 hover:-translate-y-1 transition-all">
                  {charity.cover_image_url && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={charity.cover_image_url}
                        alt={charity.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {charity.logo_url ? (
                        <img src={charity.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 text-error-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{charity.name}</h3>
                        <span className="text-stone-500 text-xs capitalize">{charity.category}</span>
                      </div>
                      {charity.is_featured && (
                        <Star className="w-4 h-4 text-secondary-400 fill-secondary-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-stone-400 text-xs line-clamp-2 mb-4">{charity.short_description}</p>
                    <div className="flex justify-between text-xs">
                      <div>
                        <p className="text-stone-500">Raised</p>
                        <p className="text-primary-400 font-bold">{formatCurrency(charity.total_raised)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-stone-500">Supporters</p>
                        <p className="text-white font-bold">{charity.supporter_count.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center text-stone-500">
                No charities found matching your search.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
