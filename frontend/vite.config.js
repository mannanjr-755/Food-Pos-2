import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const API_TARGET = process.env.POS_API_TARGET || 'http://localhost:5000'

// Express serves customer.html for /t/<number> in production; dev needs the same rewrite.
function tableMenuEntry() {
  return {
    name: 'table-menu-entry',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (/^\/t\/\d+/.test(req.url || '')) req.url = '/customer.html'
        next()
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), tableMenuEntry()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        customer: path.resolve(__dirname, 'customer.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      // Menu photos and the shipped menu art are served by the Express app.
      '/uploads': { target: API_TARGET, changeOrigin: true },
      '/static': { target: API_TARGET, changeOrigin: true },
    },
  },
})
