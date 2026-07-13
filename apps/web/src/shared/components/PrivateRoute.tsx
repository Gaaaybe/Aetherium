import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';

interface PrivateRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

/**
 * Rota protegida: redireciona para /entrar caso o usuário não esteja autenticado.
 * Caso adminOnly seja verdadeiro, bloqueia usuários sem privilégios de Admin.
 * Preserva a rota original em `state.from` para redirecionamento pós-login.
 */
export function PrivateRoute({ children, adminOnly }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
