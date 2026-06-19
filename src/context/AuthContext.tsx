import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        // Profile doesn't exist, try to create it
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const newProfile = {
            id: userId,
            full_name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'User',
            phone: userData.user.user_metadata?.phone || null,
            role: 'customer' as const,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .maybeSingle();

          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }
          return createdProfile;
        }
      }

      return data;
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (isMounted.current) {
        setProfile(profileData);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isMounted.current) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id);
          if (isMounted.current) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted.current) return;

      console.log('Auth state change:', event);

      // For SIGNED_IN, we need to fetch profile before stopping loading
      // to avoid race condition where admin page shows "Access Restricted"
      if (event === 'SIGNED_IN' && newSession?.user) {
        setLoading(true);
        setSession(newSession);
        setUser(newSession.user);
        // Use setTimeout to avoid potential deadlock with onAuthStateChange
        setTimeout(async () => {
          if (!isMounted.current) return;
          const profileData = await fetchProfile(newSession.user.id);
          if (isMounted.current) {
            setProfile(profileData);
            setLoading(false);
          }
        }, 0);
      } else {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(async () => {
            if (!isMounted.current) return;
            const profileData = await fetchProfile(newSession.user.id);
            if (isMounted.current) {
              setProfile(profileData);
            }
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUser(null);
          setSession(null);
        }

        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
