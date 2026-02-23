import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authStorage } from './storage';

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = authStorage.getUser();
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}
