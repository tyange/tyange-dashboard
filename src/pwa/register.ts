import { registerSW } from 'virtual:pwa-register'

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null

export function ensureDashboardServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.reject(new Error('이 브라우저에서는 서비스 워커를 지원하지 않습니다.'))
  }

  if (registrationPromise) {
    return registrationPromise
  }

  registrationPromise = new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    let settled = false

    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (settled) {
          return
        }

        if (registration) {
          settled = true
          resolve(registration)
          return
        }

        void navigator.serviceWorker.ready
          .then((readyRegistration) => {
            if (settled) {
              return
            }

            settled = true
            resolve(readyRegistration)
          })
          .catch((error: unknown) => {
            if (settled) {
              return
            }

            settled = true
            registrationPromise = null
            reject(error instanceof Error ? error : new Error('서비스 워커 등록 실패'))
          })
      },
      onRegisterError(error) {
        if (settled) {
          return
        }

        settled = true
        registrationPromise = null
        reject(error instanceof Error ? error : new Error('서비스 워커 등록 실패'))
      },
    })
  })

  return registrationPromise
}
