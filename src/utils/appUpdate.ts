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

export async function installAppUpdate() {
  const registration = await getServiceWorkerRegistration()

  return new Promise<boolean>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup()
      resolve(false)
    }, 5000)

    const cleanup = () => {
      window.clearTimeout(timeoutId)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      registration.removeEventListener('updatefound', handleUpdateFound)

      if (installingWorker) {
        installingWorker.removeEventListener('statechange', handleStateChange)
      }
    }

    const finish = (updated: boolean) => {
      cleanup()
      resolve(updated)
    }

    const fail = (error: unknown) => {
      cleanup()
      reject(error instanceof Error ? error : new Error('Update ophalen mislukt.'))
    }

    let installingWorker: ServiceWorker | null = null

    const handleControllerChange = () => finish(true)

    const handleStateChange = () => {
      if (!installingWorker) {
        return
      }

      if (installingWorker.state === 'activated') {
        finish(true)
      }

      if (installingWorker.state === 'redundant') {
        finish(false)
      }
    }

    const attachInstallingWorker = () => {
      if (!registration.installing || registration.installing === installingWorker) {
        return
      }

      if (installingWorker) {
        installingWorker.removeEventListener('statechange', handleStateChange)
      }

      installingWorker = registration.installing
      installingWorker.addEventListener('statechange', handleStateChange)
    }

    const handleUpdateFound = () => {
      attachInstallingWorker()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    registration.addEventListener('updatefound', handleUpdateFound)

    if (registration.waiting) {
      finish(true)
      return
    }

    attachInstallingWorker()

    void registration.update().catch((error) => {
      fail(error)
    })
  })
}
