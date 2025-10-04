import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker (vite-plugin-pwa auto-inject) only in production build
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // The plugin will generate sw.js in dist root
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('SW registration failed', err);
    });
  });
}
