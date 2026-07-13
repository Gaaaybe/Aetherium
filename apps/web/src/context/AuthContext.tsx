import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { getToken, clearToken, setUnauthorizedHandler } from '@/lib/api';
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '@/services/auth.service';
import type { LoginPayload, RegisterPayload } from '@/services/types';
import { AuthContext, type AuthUser } from './auth-context';

// Decodifica o payload do JWT sem biblioteca externa
function decodeJwtPayload(token: string): { sub: string; email: string; name: string; isAdmin?: boolean; exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // Se não houver exp (token sem expiração), considera válido
  if (!payload.exp) return true;
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getToken();
    if (!token) return null;
    if (!isTokenValid(token)) {
      clearToken();
      return null;
    }
    const payload = decodeJwtPayload(token);
    if (payload) return { id: payload.sub, email: payload.email, name: payload.name ?? payload.email, isAdmin: !!payload.isAdmin };
    return null;
  });

  // Ref para o timeout de expiração — armazena o ID para cancelamento
  const expirationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa dados temporários do criador de poder que não têm escopo por usuário
  const limparDadosCriador = () => {
    localStorage.removeItem('criador-de-poder-autosave');
    localStorage.removeItem('criador-de-poder-carregar');
  };

  const logout = useCallback(() => {
    logoutService();
    limparDadosCriador();
    setUser(null);
  }, []);

  /**
   * Agenda um setTimeout único que dispara exatamente quando o token expira.
   * Muito mais preciso e eficiente que um setInterval periódico.
   */
  const scheduleExpirationLogout = useCallback(() => {
    if (expirationTimerRef.current) clearTimeout(expirationTimerRef.current);

    const token = getToken();
    if (!token) return;

    const payload = decodeJwtPayload(token);
    if (!payload) return;

    if (!payload.exp) return; // token sem expiração: não agenda

    const msUntilExpiry = payload.exp * 1000 - Date.now();

    // Sempre agenda via setTimeout — evita setState síncrono dentro de useEffect
    expirationTimerRef.current = setTimeout(logout, Math.max(0, msUntilExpiry));
  }, [logout]);

  // Agenda na montagem (token já presente no localStorage)
  useEffect(() => {
    scheduleExpirationLogout();
    return () => {
      if (expirationTimerRef.current) clearTimeout(expirationTimerRef.current);
    };
  }, [scheduleExpirationLogout]);

  // Registra handler de 401 para logout automático quando o servidor rejeitar o token
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginService(payload);
    const decoded = decodeJwtPayload(response.access_token);
    if (!decoded) throw new Error('Resposta de autenticação inválida');
    // Limpa trabalho em progresso do usuário anterior antes de definir o novo
    limparDadosCriador();
    flushSync(() => setUser({ id: decoded.sub, email: decoded.email, name: decoded.name ?? decoded.email, isAdmin: !!decoded.isAdmin }));
    scheduleExpirationLogout();
  }, [scheduleExpirationLogout]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerService(payload);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
