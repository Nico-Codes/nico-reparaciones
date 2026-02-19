import './bootstrap';
import '../css/app.css';
import { initReactIslands } from './react/islands';
import { initStoreAjaxNavigation } from './modules/storeAjaxNavigation';

declare global {
  interface Window {
    NR_APP_VERSION?: string;
  }
}

window.NR_APP_VERSION = 'react-islands-core-v1';
console.log('[NR] app.ts cargado:', window.NR_APP_VERSION);

document.addEventListener('DOMContentLoaded', () => {
  try {
    initStoreAjaxNavigation();
  } catch (error) {
    console.error('[NR] initStoreAjaxNavigation error', error);
  }

  try {
    initReactIslands();
  } catch (error) {
    console.error('[NR] initReactIslands error', error);
  }
});
