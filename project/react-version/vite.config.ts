import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['mammoth', 'pdfjs-dist'],
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/projects': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      },
      '/images': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3001,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/projects': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      },
      '/images': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
})
