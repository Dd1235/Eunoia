// src/context/AuthContext.tsx
import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export type User = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── initial session fetch ──────────────────────────────
  useEffect(() => {
    let ignore = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!ignore) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    })();

    // listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  // ── helpers exposed to the tree ─────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextType>(() => ({ user, loading, logout }), [user, loading, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
