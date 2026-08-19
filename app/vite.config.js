import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset URLs relative, so the built site works whether it's
// served from a domain root (Netlify/Vercel) or a subpath (GitHub Pages).
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
})
