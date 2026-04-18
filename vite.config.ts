import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    transformer: 'postcss', // Force postcss to handle CSS
  },
  build: {
    cssMinify: 'esbuild', // Use esbuild for minification as lightningcss has issues with Tailwind 4 @theme
  },
  server: {
    allowedHosts: [
      'sheldon-unexcerpted-overwillingly.ngrok-free.dev',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})