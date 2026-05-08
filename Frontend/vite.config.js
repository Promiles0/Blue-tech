import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('\n[proxy] ❌ Backend unreachable at http://127.0.0.1:8080')
            console.error('[proxy]    Is the Spring Boot server running? (mvnw spring-boot:run)')
            console.error('[proxy]    Error:', err.message, '\n')
          })
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ['recharts'],
  },
})
