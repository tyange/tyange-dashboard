import type {
  BrowserPushStatus,
  PushSubscriptionPayload,
  SavedPushSubscriptionRecord,
} from './types'
import { toPushSubscriptionPayload } from './push'

function matchesByKeys(
  left: PushSubscriptionPayload | null,
  right: SavedPushSubscriptionRecord,
) {
  if (!left || !right.keys?.p256dh || !right.keys?.auth) {
    return false
  }

  return left.keys.p256dh === right.keys.p256dh && left.keys.auth === right.keys.auth
}

export function reconcileBrowserPushStatus(
  localSubscription: PushSubscription | null,
  serverSubscriptions: SavedPushSubscriptionRecord[],
): BrowserPushStatus {
  const localPayload = localSubscription ? toPushSubscriptionPayload(localSubscription) : null

  const matchedServerSubscription =
    serverSubscriptions.find((subscription) => subscription.endpoint === localPayload?.endpoint) ??
    serverSubscriptions.find((subscription) => matchesByKeys(localPayload, subscription)) ??
    null

  return {
    localSubscription,
    localPayload,
    matchedServerSubscription,
    serverHasCurrentBrowser: Boolean(matchedServerSubscription),
  }
}
