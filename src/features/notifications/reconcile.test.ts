import { describe, expect, it } from 'vitest'
import { reconcileBrowserPushStatus } from './reconcile'
import type { SavedPushSubscriptionRecord } from './types'

function createSubscription(endpoint: string, p256dh: string, auth: string) {
  return {
    endpoint,
    toJSON() {
      return {
        endpoint,
        keys: {
          p256dh,
          auth,
        },
      }
    },
  } as unknown as PushSubscription
}

function createServerSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
): SavedPushSubscriptionRecord {
  return {
    endpoint,
    keys: {
      p256dh,
      auth,
    },
    raw: {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    },
  }
}

describe('reconcileBrowserPushStatus', () => {
  it('matches the current browser by endpoint first', () => {
    const localSubscription = createSubscription('https://push.example/current', 'local-key', 'local-auth')
    const serverSubscriptions = [
      createServerSubscription('https://push.example/other', 'other-key', 'other-auth'),
      createServerSubscription('https://push.example/current', 'server-key', 'server-auth'),
    ]

    const result = reconcileBrowserPushStatus(localSubscription, serverSubscriptions)

    expect(result.serverHasCurrentBrowser).toBe(true)
    expect(result.matchedServerSubscription?.endpoint).toBe('https://push.example/current')
  })

  it('falls back to matching the current browser by subscription keys', () => {
    const localSubscription = createSubscription('https://push.example/local', 'same-key', 'same-auth')
    const serverSubscriptions = [
      createServerSubscription('https://push.example/server', 'same-key', 'same-auth'),
    ]

    const result = reconcileBrowserPushStatus(localSubscription, serverSubscriptions)

    expect(result.serverHasCurrentBrowser).toBe(true)
    expect(result.matchedServerSubscription?.endpoint).toBe('https://push.example/server')
  })
})
