import { Navigate } from 'react-router-dom';
import { authStorage } from './storage';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = authStorage.getUser();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
