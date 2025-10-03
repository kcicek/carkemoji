import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages deployment under https://<user>.github.io/carkemoji we must set base to '/carkemoji/'.
// In local dev and during preview (vite preview) this is handled automatically.
// If you fork/rename repo, update this value accordingly.
const isProd = process.env.GITHUB_PAGES === 'true' || process.env.VITE_APP_BASE === 'github';

export default defineConfig(({ command }) => {
  return {
    base: isProd ? '/carkemoji/' : '/',
    plugins: [react()],
    build: {
      outDir: 'dist'
    }
  };
});
