import { createContext } from 'react';
import type { LoginPayload, RegisterPayload } from '@/services/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
