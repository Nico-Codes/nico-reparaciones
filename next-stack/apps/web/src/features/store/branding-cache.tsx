import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { storeApi } from './api';
import type { StoreBrandingAssets } from './types';

const StoreBrandingContext = createContext<StoreBrandingAssets | null>(null);

let cachedBranding: StoreBrandingAssets | null = null;
let brandingRequest: Promise<StoreBrandingAssets | null> | null = null;
const listeners = new Set<(branding: StoreBrandingAssets | null) => void>();

function notifyBrandingSubscribers() {
  listeners.forEach((listener) => listener(cachedBranding));
}

export function setStoreBrandingCache(branding: StoreBrandingAssets | null) {
  cachedBranding = branding;
  notifyBrandingSubscribers();
}

export function loadStoreBranding() {
  if (cachedBranding) return Promise.resolve(cachedBranding);
  if (brandingRequest) return brandingRequest;

  brandingRequest = storeApi
    .branding()
    .then((branding) => {
      setStoreBrandingCache(branding);
      return branding;
    })
    .catch(() => {
      setStoreBrandingCache(null);
      return null;
    })
    .finally(() => {
      brandingRequest = null;
    });

  return brandingRequest;
}

function shouldDeferBrandingLoad(pathname: string, search: string) {
  if (search) return false;
  return pathname === '/' || pathname === '/store' || pathname === '/tienda';
}

export function StoreBrandingProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [branding, setBranding] = useState<StoreBrandingAssets | null>(cachedBranding);

  useEffect(() => {
    listeners.add(setBranding);
    return () => {
      listeners.delete(setBranding);
    };
  }, []);

  useEffect(() => {
    if (cachedBranding || shouldDeferBrandingLoad(location.pathname, location.search)) return;
    void loadStoreBranding();
  }, [location.pathname, location.search]);

  return <StoreBrandingContext.Provider value={branding}>{children}</StoreBrandingContext.Provider>;
}

export function useStoreBranding() {
  return useContext(StoreBrandingContext);
}
