import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    // Dev-only proxy: routes /api → localhost:3001 during local development.
    // In production on Vercel, VITE_API_URL points directly to the Render backend.
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    } : undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  }
}))
