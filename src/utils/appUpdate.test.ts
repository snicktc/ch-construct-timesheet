import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installAppUpdate, setServiceWorkerRegistration } from './appUpdate'

type Listener = (event?: unknown) => void

class FakeEventTarget {
  private listeners = new Map<string, Set<Listener>>()

  addEventListener(type: string, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set<Listener>()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: string, event?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }
}

class FakeWorker extends FakeEventTarget {
  state: ServiceWorker['state']
  postMessage = vi.fn()

  constructor(state: ServiceWorker['state'] = 'installing') {
    super()
    this.state = state
  }

  setState(state: ServiceWorker['state']) {
    this.state = state
    this.emit('statechange')
  }
}

class FakeRegistration extends FakeEventTarget {
  installing: FakeWorker | null = null
  waiting: FakeWorker | null = null
  update = vi.fn().mockResolvedValue(undefined)
}

class FakeServiceWorkerContainer extends FakeEventTarget {}

describe('installAppUpdate', () => {
  let container: FakeServiceWorkerContainer

  beforeEach(() => {
    vi.useFakeTimers()
    container = new FakeServiceWorkerContainer()
    vi.stubGlobal('navigator', { serviceWorker: container })
  })

  afterEach(() => {
    setServiceWorkerRegistration(undefined)
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('activates an already waiting worker and resolves true on controllerchange', async () => {
    const registration = new FakeRegistration()
    const waiting = new FakeWorker('installed')
    registration.waiting = waiting
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration)

    const promise = installAppUpdate()

    // Let the awaited registration resolve.
    await Promise.resolve()

    // The waiting worker is asked to skip waiting.
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })

    // Simulate the new worker taking control.
    container.emit('controllerchange')

    await expect(promise).resolves.toBe(true)
  })

  it('installs a newly found worker, activates it and resolves true', async () => {
    const registration = new FakeRegistration()
    const installing = new FakeWorker('installing')

    // update() discovers a new worker and exposes it via `installing`.
    registration.update.mockImplementation(async () => {
      registration.installing = installing
    })
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration)

    const promise = installAppUpdate()

    // Let the awaited registration resolve and update() settle.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    // It finishes installing -> waiting -> we post SKIP_WAITING.
    installing.setState('installed')
    expect(installing.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })

    container.emit('controllerchange')

    await expect(promise).resolves.toBe(true)
  })

  it('resolves false when no new worker is found', async () => {
    const registration = new FakeRegistration()
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration)

    const promise = installAppUpdate()

    // update() resolves with no installing/waiting worker.
    await Promise.resolve()
    await Promise.resolve()

    await expect(promise).resolves.toBe(false)
  })

  it('resolves false when the installing worker becomes redundant', async () => {
    const registration = new FakeRegistration()
    const installing = new FakeWorker('installing')
    registration.update.mockImplementation(async () => {
      registration.installing = installing
    })
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration)

    const promise = installAppUpdate()

    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    installing.setState('redundant')

    await expect(promise).resolves.toBe(false)
  })

  it('rejects when update() fails', async () => {
    const registration = new FakeRegistration()
    registration.update.mockRejectedValue(new Error('netwerkfout'))
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration)

    await expect(installAppUpdate()).rejects.toThrow('netwerkfout')
  })
})
