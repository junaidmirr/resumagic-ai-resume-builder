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
    rollupOptions: {
      external: ['canvas'],
    },
  },
  optimizeDeps: {
    exclude: ['canvas'],
  },
  server: {
    watch: {
      ignored: [
        '**/*.txt',
        '**/*.log',
        '**/backend/**',
        '**/performance_metrics.txt',
        '**/logs/**',
      ],
    },
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