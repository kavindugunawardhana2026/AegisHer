import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// /api is proxied to the FastAPI backend so no CORS setup is needed.
const proxy = {
  '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
}

// Lets a Cloudflare quick tunnel (https://<random>.trycloudflare.com) reach the
// dev/preview server when sharing a temporary public link.
const allowedHosts = ['.trycloudflare.com']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy, allowedHosts },
  preview: { proxy, allowedHosts },
})
