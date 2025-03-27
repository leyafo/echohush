// vite.config.website.js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  root: 'website',
  build: {
    outDir: '../website_dist', 
  },
});
