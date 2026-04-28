import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Globe, Calendar, ArrowLeft, Users, TrendingUp } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { Charity, formatCurrency } from '../lib/types';
import { Button } from '../components/ui/Button';

export function CharityProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('charities')
      .select('*, charity_events(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setCharity(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="py-32 text-center text-stone-500">Loading...</div>
      </Layout>
    );
  }

  if (!charity) {
    return (
      <Layout>
        <div className="py-32 text-center">
          <p className="text-white text-xl font-bold mb-4">Charity not found</p>
          <Link to="/charities"><Button>Browse Charities</Button></Link>
        </div>
      </Layout>
    );
  }

  const events = charity.charity_events ?? [];

  return (
    <Layout>
      {/* Cover */}
      <div className="relative h-72 overflow-hidden">
        {charity.cover_image_url ? (
          <img src={charity.cover_image_url} alt={charity.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-950 to-stone-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-16 relative">
        <Link to="/charities" className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All Charities
        </Link>

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          {charity.logo_url ? (
            <img src={charity.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-700" />
          ) : (
            <div className="w-20 h-20 bg-stone-800 border-2 border-stone-700 rounded-2xl flex items-center justify-center">
              <Heart className="w-10 h-10 text-error-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{charity.name}</h1>
              {charity.is_featured && (
                <span className="px-2 py-0.5 bg-secondary-500/20 text-secondary-400 text-xs rounded-full">Featured</span>
              )}
            </div>
            <p className="text-stone-400 capitalize">{charity.category} · {charity.country}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: TrendingUp, label: 'Total Raised', value: formatCurrency(charity.total_raised), color: 'primary' },
            { icon: Users, label: 'Supporters', value: charity.supporter_count.toLocaleString(), color: 'accent' },
            { icon: Heart, label: 'Category', value: charity.category.charAt(0).toUpperCase() + charity.category.slice(1), color: 'error' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${
                color === 'primary' ? 'text-primary-400' :
                color === 'accent' ? 'text-accent-400' : 'text-error-400'
              }`} />
              <p className={`font-bold ${
                color === 'primary' ? 'text-primary-400' :
                color === 'accent' ? 'text-accent-400' : 'text-error-400'
              }`}>{value}</p>
              <p className="text-stone-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">About</h2>
              <p className="text-stone-300 leading-relaxed">{charity.description}</p>
            </div>

            {/* Events */}
            {events.length > 0 && (
              <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  Upcoming Events
                </h2>
                <div className="space-y-3">
                  {events.map((event: any) => (
                    <div key={event.id} className="p-3 bg-stone-800/50 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium text-sm">{event.title}</p>
                          {event.description && <p className="text-stone-400 text-xs mt-1">{event.description}</p>}
                          {event.location && <p className="text-stone-500 text-xs mt-1">📍 {event.location}</p>}
                        </div>
                        <p className="text-primary-400 text-xs whitespace-nowrap">
                          {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Support this charity</h3>
              <p className="text-stone-400 text-sm mb-4">
                Subscribe to GolfHeroes and select this charity to start contributing from your subscription.
              </p>
              <Link to="/pricing" className="block">
                <Button className="w-full" variant="gold">
                  Subscribe & Support
                </Button>
              </Link>
            </div>

            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                <div className="p-4 bg-stone-900/60 border border-stone-700/40 rounded-xl flex items-center gap-3 hover:border-stone-600/60 transition-all">
                  <Globe className="w-5 h-5 text-accent-400" />
                  <span className="text-stone-300 text-sm">Official Website</span>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
