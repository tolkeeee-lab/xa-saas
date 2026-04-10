'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CaisseSession {
  boutiqueId: string;
  boutiqueNom: string;
  employeId: string | null;
  acteurNom: string;
  acteurType: 'proprietaire' | 'employe';
}

interface AuthContextValue {
  session: CaisseSession | null;
  isAuthenticated: boolean;
  login: (session: CaisseSession) => void;
  logout: () => void;
}

const SESSION_KEY = 'xa_caisse_session';

export const AuthContext = createContext<AuthContextValue>({
  session: null, isAuthenticated: false, login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CaisseSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw) as CaisseSession);
    } catch {}
  }, []);

  const login = useCallback((s: CaisseSession) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    router.push('/caisse');
  }, [router]);

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: session !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
