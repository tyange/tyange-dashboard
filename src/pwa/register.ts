import { registerSW } from 'virtual:pwa-register'

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null
const REGISTRATION_TIMEOUT_MS = 8000

export function ensureDashboardServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.reject(new Error('이 브라우저에서는 서비스 워커를 지원하지 않습니다.'))
  }

  if (registrationPromise) {
    return registrationPromise
  }

  registrationPromise = new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    let settled = false
    const settleWithError = (error: unknown) => {
      if (settled) {
        return
      }

      settled = true
      registrationPromise = null
      reject(error instanceof Error ? error : new Error('서비스 워커 등록 실패'))
    }
    const timeoutId = window.setTimeout(() => {
      settleWithError(new Error('서비스 워커 등록이 지연되고 있습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.'))
    }, REGISTRATION_TIMEOUT_MS)
    const settleWithRegistration = (registration: ServiceWorkerRegistration) => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)
      resolve(registration)
    }

    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          settleWithRegistration(registration)
          return
        }

        void navigator.serviceWorker.ready
          .then((readyRegistration) => {
            settleWithRegistration(readyRegistration)
          })
          .catch((error: unknown) => settleWithError(error))
      },
      onRegisterError(error) {
        settleWithError(error)
      },
    })
  })

  return registrationPromise
}
