import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { fileURLToPath, URL } from 'url'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@public': fileURLToPath(new URL('./public', import.meta.url))
      }
    },
    publicDir: 'public', // Ensure public directory is configured,
    proxy: {
      '/api': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      }
    }
  }
})



