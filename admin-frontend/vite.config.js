import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5175,
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'glamourbeauty-admin-production.up.railway.app',
      'dependable-quietude-production-bfac.up.railway.app'
    ]
  }
})