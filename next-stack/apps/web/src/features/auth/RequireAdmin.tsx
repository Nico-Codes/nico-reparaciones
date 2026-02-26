import { Navigate, useLocation } from 'react-router-dom';
import { authStorage } from './storage';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = authStorage.getUser();

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/store" replace />;
  }

  return <>{children}</>;
}
