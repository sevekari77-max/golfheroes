import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Subscription } from '../lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSubscribed: boolean;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  subscription: null,
  isLoading: true,
  isAdmin: false,
  isSubscribed: false,
  refreshProfile: async () => {},
  refreshSubscription: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    return data;
  };

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle();
    setSubscription(data);
    return data;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (user) await fetchSubscription(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchSubscription(session.user.id),
        ]).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id),
          ]);
          setIsLoading(false);
        })();
      } else {
        setProfile(null);
        setSubscription(null);
        setIsLoading(false);
      }
    });
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isSubscribed = subscription?.status === 'active';

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      subscription,
      isLoading,
      isAdmin,
      isSubscribed,
      refreshProfile,
      refreshSubscription,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
