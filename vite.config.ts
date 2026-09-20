import type { Plugin } from 'vite'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Build id, baked into the bundle and written to version.json next to it.
 * The app compares the two to notice that a newer build was deployed.
 */
const buildId = process.env.GITHUB_SHA?.slice(0, 12) ?? `dev-${Date.now().toString(36)}`

function versionFile(): Plugin {
  const body = `${JSON.stringify({ build: buildId })}\n`
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: body })
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(body)
      })
    },
  }
}

// On GitHub Pages the site lives under /<repo>/; the workflow sets BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue(), tailwindcss(), versionFile()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
})
