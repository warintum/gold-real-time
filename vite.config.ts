import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['p5173.doodee.cc'],
    proxy: {
      // Binance Futures API (มี XAUUSDT)
      '/api/binance': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
      },
    },
  },
});
