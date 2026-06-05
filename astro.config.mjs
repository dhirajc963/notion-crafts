import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
// Static, frontend-only build — deploys to any static host (Cloudflare Pages,
// Vercel, Netlify). The whole product is a client-side React island; no backend.
export default defineConfig({
  output: 'static',
  integrations: [react()],
});
