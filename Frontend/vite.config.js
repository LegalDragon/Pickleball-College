import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@public': fileURLToPath(new URL('./public', import.meta.url))
    }
  },
  publicDir: 'public',
  envDir: './src', // Look for .env files in src directory
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/materials': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/sessions': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/theme': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/users': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/contenttypes': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/courses': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/assets': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/ratings': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/tags': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/videoreviews': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://localhost:7009',
        changeOrigin: true,
        secure: false
      }
    }
  }
})



