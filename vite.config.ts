import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// For GitHub Pages deployment under https://<user>.github.io/carkemoji we must set base to '/carkemoji/'.
// In local dev and during preview (vite preview) this is handled automatically.
// If you fork/rename repo, update this value accordingly.
const isProd = process.env.GITHUB_PAGES === 'true' || process.env.VITE_APP_BASE === 'github';

export default defineConfig(({ command }) => {
  return {
    base: isProd ? '/carkemoji/' : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
        },
        manifest: {
          name: 'ÇarkEmoji',
          short_name: 'ÇarkEmoji',
          description: 'Türkçe atasözleri ve deyimleriyle emoji tahmin oyunu',
          lang: 'tr',
          start_url: '/',
          scope: '/',
            display: 'standalone',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ],
    build: {
      outDir: 'dist'
    }
  };
});
