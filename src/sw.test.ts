import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const precacheAndRoute = vi.fn()
const clientsClaim = vi.fn()
const registerRoute = vi.fn()
const skipWaiting = vi.fn()
const matchAll = vi.fn()
const openWindow = vi.fn()
const addEventListener = vi.fn()

class MockExpirationPlugin {
  options: unknown

  constructor(options: unknown) {
    this.options = options
  }
}

class MockCacheFirst {
  options: unknown

  constructor(options: unknown) {
    this.options = options
  }
}

vi.mock('workbox-core', () => ({ clientsClaim }))
vi.mock('workbox-precaching', () => ({ precacheAndRoute }))
vi.mock('workbox-routing', () => ({ registerRoute }))
vi.mock('workbox-strategies', () => ({ CacheFirst: MockCacheFirst }))
vi.mock('workbox-expiration', () => ({ ExpirationPlugin: MockExpirationPlugin }))

describe('service worker', () => {
  beforeEach(() => {
    precacheAndRoute.mockReset()
    clientsClaim.mockReset()
    registerRoute.mockReset()
    skipWaiting.mockReset()
    matchAll.mockReset()
    openWindow.mockReset()
    addEventListener.mockReset()

    vi.stubGlobal('self', {
      __WB_MANIFEST: [{ url: '/index.html', revision: '1' }],
      skipWaiting,
      addEventListener,
      registration: { scope: '/' },
      clients: {
        matchAll,
        openWindow,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('registers precache, runtime caching and notification click handling', async () => {
    await import('./sw')

    expect(precacheAndRoute).toHaveBeenCalledWith([{ url: '/index.html', revision: '1' }])
    expect(skipWaiting).toHaveBeenCalled()
    expect(clientsClaim).toHaveBeenCalled()
    expect(registerRoute).toHaveBeenCalledTimes(1)
    expect(addEventListener).toHaveBeenCalledWith('notificationclick', expect.any(Function))
  })

  it('focuses an existing client on notification click and falls back to openWindow', async () => {
    await import('./sw')
    const handler = addEventListener.mock.calls[0][1] as (event: NotificationEvent) => void

    const navigate = vi.fn()
    const focus = vi.fn().mockResolvedValue(undefined)
    matchAll.mockResolvedValueOnce([{ navigate, focus }])

    const eventOne = {
      notification: {
        close: vi.fn(),
        data: { url: '/?tab=week' },
      },
      waitUntil: (promise: Promise<unknown>) => promise,
    } as unknown as NotificationEvent

    await handler(eventOne)

    expect(eventOne.notification.close).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/?tab=week')
    expect(focus).toHaveBeenCalled()

    matchAll.mockResolvedValueOnce([])
    openWindow.mockResolvedValueOnce(undefined)
    const eventTwo = {
      notification: {
        close: vi.fn(),
        data: {},
      },
      waitUntil: (promise: Promise<unknown>) => promise,
    } as unknown as NotificationEvent

    await handler(eventTwo)

    expect(openWindow).toHaveBeenCalledWith('/')
  })
})
