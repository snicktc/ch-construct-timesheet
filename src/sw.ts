/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import('workbox-build').ManifestEntry>
}

precacheAndRoute(self.__WB_MANIFEST)
self.skipWaiting()
clientsClaim()

registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin && ['style', 'script', 'image', 'font'].includes(request.destination),
  new CacheFirst({
    cacheName: 'app-static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = typeof event.notification.data?.url === 'string' ? event.notification.data.url : '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          void client.navigate(targetUrl)
          return client.focus()
        }
      }

      return self.clients.openWindow(targetUrl)
    }),
  )
})

export {}
