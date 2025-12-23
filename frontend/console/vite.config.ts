import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@sofiapos/ui': path.resolve(__dirname, '../sofia-ui/src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: '0.0.0.0', // Allow external connections
      port: 3000,
      proxy: {
        '/api': {
          // Proxy to API service (works in Docker) or localhost (local dev)
          // Use VITE_API_URL from environment, fallback to localhost:8001 for local dev
          target: env.VITE_API_URL || 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          // Proxy static file requests to backend API server
          // Static files are served without authentication
          target: env.VITE_API_URL || 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})

