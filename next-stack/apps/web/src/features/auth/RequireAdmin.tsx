import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authStorage } from './storage';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState(() => authStorage.getUser());

  useEffect(() => {
    const sync = () => setUser(authStorage.getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('nico:auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('nico:auth-changed', sync);
    };
  }, []);

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/store" replace />;
  }

  return <>{children}</>;
}
