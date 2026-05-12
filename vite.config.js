import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleCheckRequest } from './server/inspect.js'

function shipcheckApiPlugin() {
  return {
    name: 'shipcheck-api',
    configureServer(server) {
      server.middlewares.use('/api/check', (req, res) => {
        handleCheckRequest(req, res, req.originalUrl || req.url)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/check', (req, res) => {
        handleCheckRequest(req, res, req.originalUrl || req.url)
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), shipcheckApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: ['shipcheck.krissemmy.com']
  }
})
