import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StoreBrandingProvider } from '@/features/store/branding-cache';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreBrandingProvider>
        <App />
      </StoreBrandingProvider>
    </BrowserRouter>
  </StrictMode>,
);
