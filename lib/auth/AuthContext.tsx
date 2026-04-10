'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Boutique, Employe } from '../../types/database';

interface Session { boutique: Boutique; employe: Employe; }
interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  login: (boutique: Boutique, employe: Employe) => void;
  logout: () => void;
}

const SESSION_KEY = 'xa_session';

export const AuthContext = createContext<AuthContextValue>({
  session: null, isAuthenticated: false, login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {}
  }, []);

  const login = useCallback((boutique: Boutique, employe: Employe) => {
    const s: Session = { boutique, employe };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    document.cookie = 'xa_authenticated=true; path=/; SameSite=Strict';
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    document.cookie = 'xa_authenticated=; path=/; max-age=0; SameSite=Strict';
    setSession(null);
    router.push('/auth/boutique');
  }, [router]);

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: session !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
