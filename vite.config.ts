import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The public ad is a separate Vite HTML entry, also reachable at /add in dev/preview.
const adRoute: Plugin = {
  name: 'standalone-ad-route',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.split('?')[0] === '/add' || req.url?.split('?')[0] === '/add/') req.url = req.url.replace(/^\/add\/?/, '/ads/index.html')
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.split('?')[0] === '/add' || req.url?.split('?')[0] === '/add/') req.url = req.url.replace(/^\/add\/?/, '/ads/index.html')
      next()
    })
  },
}
export default defineConfig({
  plugins: [react(), tailwindcss(), adRoute],
  build: { rollupOptions: { input: { main: 'index.html', ad: 'ads/index.html' } } },
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
})
