import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // สำหรับ GitHub Pages: ใช้ชื่อ repository เป็น base path
  // ตัวอย่าง: ถ้า repo ชื่อ "gold-real-time-web" ให้ใช้ '/gold-real-time-web/'
  // สำหรับ custom domain: ใช้ '/'
  base: process.env.GITHUB_PAGES === 'true'
    ? '/gold-real-time/'
    : '/',
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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
