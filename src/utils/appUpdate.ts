let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

export function setServiceWorkerRegistration(registration: ServiceWorkerRegistration | undefined) {
  serviceWorkerRegistration = registration ?? null
}

function getServiceWorkerRegistration() {
  if (serviceWorkerRegistration) {
    return Promise.resolve(serviceWorkerRegistration)
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Updates worden niet ondersteund op dit toestel.')
  }

  return navigator.serviceWorker.ready
}

/**
 * Tells a waiting service worker to activate. Combined with the `SKIP_WAITING`
 * message handler in `sw.ts`, this swaps control to the new worker which in
 * turn fires a `controllerchange` event.
 */
function activateWaitingWorker(worker: ServiceWorker) {
  worker.postMessage({ type: 'SKIP_WAITING' })
}

export async function installAppUpdate() {
  const registration = await getServiceWorkerRegistration()

  return new Promise<boolean>((resolve, reject) => {
    // Give the browser time to fetch and install a new worker. Manual updates
    // should tolerate a slow network, so keep this generous.
    const timeoutId = window.setTimeout(() => {
      finish(false)
    }, 30000)

    let installingWorker: ServiceWorker | null = null
    let settled = false

    const cleanup = () => {
      window.clearTimeout(timeoutId)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      registration.removeEventListener('updatefound', handleUpdateFound)

      if (installingWorker) {
        installingWorker.removeEventListener('statechange', handleStateChange)
      }
    }

    const finish = (updated: boolean) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      resolve(updated)
    }

    const fail = (error: unknown) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      reject(error instanceof Error ? error : new Error('Update ophalen mislukt.'))
    }

    // The new worker took control: the update is live.
    const handleControllerChange = () => finish(true)

    const handleStateChange = () => {
      if (!installingWorker) {
        return
      }

      if (installingWorker.state === 'installed') {
        // Installed and now waiting: ask it to take over.
        activateWaitingWorker(installingWorker)
        return
      }

      if (installingWorker.state === 'activated') {
        finish(true)
      }

      if (installingWorker.state === 'redundant') {
        finish(false)
      }
    }

    const trackInstallingWorker = (worker: ServiceWorker) => {
      if (worker === installingWorker) {
        return
      }

      if (installingWorker) {
        installingWorker.removeEventListener('statechange', handleStateChange)
      }

      installingWorker = worker
      installingWorker.addEventListener('statechange', handleStateChange)

      // The worker may already be past `installing` by the time we attach.
      if (installingWorker.state === 'installed') {
        activateWaitingWorker(installingWorker)
      } else if (installingWorker.state === 'activated') {
        finish(true)
      } else if (installingWorker.state === 'redundant') {
        finish(false)
      }
    }

    const handleUpdateFound = () => {
      if (registration.installing) {
        trackInstallingWorker(registration.installing)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    registration.addEventListener('updatefound', handleUpdateFound)

    // A worker is already waiting (e.g. found on a previous page load): use it.
    if (registration.waiting) {
      activateWaitingWorker(registration.waiting)
      return
    }

    // A worker is mid-install right now: track it.
    if (registration.installing) {
      trackInstallingWorker(registration.installing)
    }

    // Otherwise trigger a fresh check. If nothing new is found, no
    // `updatefound` fires and we resolve `false` once the timeout elapses.
    void registration
      .update()
      .then(() => {
        if (registration.waiting) {
          activateWaitingWorker(registration.waiting)
          return
        }

        if (registration.installing) {
          trackInstallingWorker(registration.installing)
          return
        }

        // No new worker at all: the app is already up to date.
        finish(false)
      })
      .catch((error) => {
        fail(error)
      })
  })
}
