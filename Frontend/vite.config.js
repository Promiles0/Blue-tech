import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Google Search Console ownership check: set VITE_GOOGLE_SITE_VERIFICATION on Render to the
// code from the "HTML tag" method and every page carries the tag (see docs/GOOGLE-SETUP.md).
function siteVerification(code) {
  return {
    name: 'google-site-verification',
    transformIndexHtml: (html) => (/^[\w-]{10,80}$/.test(code ?? '')
      ? html.replace('</head>', `    <meta name="google-site-verification" content="${code}" />
  </head>`)
      : html),
  }
}

export default defineConfig(({ command, mode }) => ({
  // Build stamp sent with error reports, so Admin → Site errors shows which release crashed.
  define: { __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16)) },
  build: {
    outDir: 'dist'
  },
  plugins: [react(), siteVerification(loadEnv(mode, process.cwd(), '').VITE_GOOGLE_SITE_VERIFICATION)],
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
