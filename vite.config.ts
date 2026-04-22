import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const githubPagesBase = '/ch-construct-timesheet/'
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

export default defineConfig({
  base: githubPagesBase,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'logos/logo_CH-Construct.jpg', 'logos/logo_VBW.png'],
      manifest: {
        name: 'timesheet',
        short_name: 'Werkuren',
        description: 'Werkurenregistratie voor CH Construct',
        start_url: githubPagesBase,
        scope: githubPagesBase,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e3a5f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
