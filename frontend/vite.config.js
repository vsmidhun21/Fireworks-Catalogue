import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.srirrcrackers.com/',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://api.srirrcrackers.com/',
        changeOrigin: true,
      },
    },
  },
})
