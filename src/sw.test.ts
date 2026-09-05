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

  const getHandler = (type: string) => {
    const call = addEventListener.mock.calls.find(([eventType]) => eventType === type)

    if (!call) {
      throw new Error(`No listener registered for ${type}`)
    }

    return call[1] as (event: never) => void
  }

  it('registers precache, runtime caching and notification click handling', async () => {
    await import('./sw')

    expect(precacheAndRoute).toHaveBeenCalledWith([{ url: '/index.html', revision: '1' }])
    // skipWaiting must NOT run on import; it is deferred until the app asks.
    expect(skipWaiting).not.toHaveBeenCalled()
    expect(clientsClaim).toHaveBeenCalled()
    expect(registerRoute).toHaveBeenCalledTimes(1)
    expect(addEventListener).toHaveBeenCalledWith('notificationclick', expect.any(Function))
    expect(addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
  })

  it('calls skipWaiting only when it receives a SKIP_WAITING message', async () => {
    await import('./sw')

    const messageHandler = getHandler('message') as (event: { data?: { type?: string } }) => void

    messageHandler({ data: { type: 'OTHER' } })
    expect(skipWaiting).not.toHaveBeenCalled()

    messageHandler({ data: { type: 'SKIP_WAITING' } })
    expect(skipWaiting).toHaveBeenCalledTimes(1)

    messageHandler({ data: undefined })
    expect(skipWaiting).toHaveBeenCalledTimes(1)
  })

  it('focuses an existing client on notification click and falls back to openWindow', async () => {
    await import('./sw')
    const handler = getHandler('notificationclick') as (event: NotificationEvent) => void

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
