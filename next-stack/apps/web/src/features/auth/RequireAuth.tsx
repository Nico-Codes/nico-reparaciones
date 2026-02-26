import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authStorage } from './storage';

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = authStorage.getUser();
  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }
  return <>{children}</>;
}
