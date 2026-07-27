import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export interface AuthState {
  user: User | null;
  /**
   * Presence signal for UI gating only — "is there a session right now".
   *
   * Do NOT send this to an API. It is a snapshot taken at mount and refreshed
   * only when Supabase emits an auth event, so it goes stale within the hour
   * and every endpoint starts returning 401. Request code must call
   * `getAccessToken()` from `lib/authToken`, which refreshes near expiry.
   */
  token: string | null;
  loading: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setToken(data.session?.access_token ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  async function signInAsGuest() {
    const { error } = await getSupabase().auth.signInAnonymously();
    if (error) throw error;
  }

  async function signOut() {
    await getSupabase().auth.signOut();
  }

  return {
    user,
    token,
    loading,
    isAnonymous: user?.is_anonymous ?? false,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    signOut,
  };
}
