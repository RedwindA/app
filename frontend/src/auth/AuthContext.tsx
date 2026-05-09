import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken, getToken, login as apiLogin, setOnUnauthorized, setToken } from '../api/client';

interface AuthState {
  token: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());
  const navigate = useNavigate();

  useEffect(() => {
    setOnUnauthorized(() => {
      setTok(null);
      navigate('/login', { replace: true });
    });
    return () => setOnUnauthorized(null);
  }, [navigate]);

  const login = useCallback(async (password: string) => {
    const { access_token } = await apiLogin(password);
    setToken(access_token);
    setTok(access_token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTok(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth outside <AuthProvider>');
  return v;
}
