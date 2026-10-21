import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // Build stamp sent with error reports, so Admin → Site errors shows which release crashed.
  define: { __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16)) },
  build: {
    outDir: 'dist'
  },
  plugins: [react()],
  server: command === 'serve' ? {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('\n[proxy] ❌ Backend unreachable at http://127.0.0.1:8080')
            console.error('[proxy] Is the Spring Boot server running? (mvnw spring-boot:run)')
            console.error('[proxy] Error:', err.message, '\n')
          })
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  } : {},
  optimizeDeps: {
    include: ['recharts'],
  },
}))
