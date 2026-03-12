import { ensureDashboardServiceWorkerRegistration } from '../../pwa/register'
import type { PushSubscriptionPayload, PushSupportState } from './types'

export function getPushSupportState(): PushSupportState {
  if (typeof window === 'undefined') {
    return { supported: false, reason: '브라우저 환경에서만 사용할 수 있습니다.' }
  }

  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: '이 브라우저는 서비스 워커를 지원하지 않습니다.' }
  }

  if (!('PushManager' in window)) {
    return { supported: false, reason: '이 브라우저는 푸시 알림을 지원하지 않습니다.' }
  }

  if (!('Notification' in window)) {
    return { supported: false, reason: '이 브라우저는 알림 권한 API를 지원하지 않습니다.' }
  }

  return { supported: true }
}

export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('이 브라우저는 알림 권한 요청을 지원하지 않습니다.')
  }

  return Notification.requestPermission()
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    return null
  }

  return registration.pushManager.getSubscription()
}

export async function subscribeCurrentBrowser(publicKey: string): Promise<PushSubscription> {
  const registration = await ensureDashboardServiceWorkerRegistration()

  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) {
    return existingSubscription
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })
}

export function toPushSubscriptionPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth

  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('브라우저 푸시 구독 정보를 읽지 못했습니다.')
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh,
      auth,
    },
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const normalized = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/')
  const rawData = window.atob(normalized)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}
