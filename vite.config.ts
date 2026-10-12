import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Independent ad HTML entries, available at their public routes in dev/preview.
const adRoute: Plugin = {
  name: 'standalone-ad-route',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = req.url?.split('?')[0]
      const destination = path === '/add' || path === '/add/' ? '/ads/index.html' : path === '/add-simple' || path === '/add-simple/' ? '/ads/simple/index.html' : null
      if (destination && req.url) req.url = destination + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = req.url?.split('?')[0]
      const destination = path === '/add' || path === '/add/' ? '/ads/index.html' : path === '/add-simple' || path === '/add-simple/' ? '/ads/simple/index.html' : null
      if (destination && req.url) req.url = destination + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')
      next()
    })
  },
}
export default defineConfig({
  plugins: [react(), tailwindcss(), adRoute],
  build: { rollupOptions: { input: { main: 'index.html', ad: 'ads/index.html', simpleAd: 'ads/simple/index.html' } } },
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
})
