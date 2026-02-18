import './bootstrap';
import '../css/app.css';
import { initReactIslands } from './react/islands';

declare global {
  interface Window {
    NR_APP_VERSION?: string;
  }
}

window.NR_APP_VERSION = 'react-islands-core-v1';
console.log('[NR] app.ts cargado:', window.NR_APP_VERSION);

document.addEventListener('DOMContentLoaded', () => {
  initReactIslands();
});
