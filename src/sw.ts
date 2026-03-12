/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import type { PushNotificationPayload } from './features/notifications/types'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string
    revision: string | null
  }>
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
self.skipWaiting()
clientsClaim()

registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event.data)
  const title = payload.title?.trim() || '새 RSS 알림'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '새 콘텐츠가 도착했습니다.',
      data: payload,
      icon: `${self.registration.scope}favicon-192x192.png`,
      badge: `${self.registration.scope}favicon-192x192.png`,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = readNotificationUrl(event.notification.data)

  event.waitUntil(
    (async () => {
      const matchedClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      if (targetUrl) {
        for (const client of matchedClients) {
          if ('focus' in client && normalizeUrl(client.url) === normalizeUrl(targetUrl)) {
            await client.focus()
            return
          }
        }

        if (self.clients.openWindow) {
          await self.clients.openWindow(targetUrl)
          return
        }
      }

      if (matchedClients.length > 0 && 'focus' in matchedClients[0]) {
        await matchedClients[0].focus()
      }
    })(),
  )
})

function readPushPayload(data: PushMessageData | null): PushNotificationPayload {
  if (!data) {
    return {}
  }

  try {
    return data.json() as PushNotificationPayload
  } catch {
    return {
      body: data.text(),
    }
  }
}

function readNotificationUrl(data: unknown) {
  if (!data || typeof data !== 'object' || !('url' in data)) {
    return null
  }

  const value = (data as { url?: unknown }).url
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeUrl(url: string) {
  try {
    return new URL(url).toString()
  } catch {
    return url
  }
}
