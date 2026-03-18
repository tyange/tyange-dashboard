export type ApiEnvelope<T = null> = {
  status: boolean
  data?: T | null
  message?: string | null
}

export type PushPublicKeyResponse = {
  public_key: string
}

export type PushPublicKeyAvailability = 'available' | 'unavailable' | 'error'

export type PushPublicKeyState =
  | {
      availability: 'available'
      publicKey: string
    }
  | {
      availability: 'unavailable'
      publicKey: null
    }
  | {
      availability: 'error'
      publicKey: null
      error: Error
    }

export type PushSubscriptionKeys = {
  p256dh: string
  auth: string
}

export type SavedPushSubscriptionKeys = {
  p256dh?: string | null
  auth?: string | null
}

export type PushSubscriptionPayload = {
  endpoint: string
  keys: PushSubscriptionKeys
}

export type SavedPushSubscriptionRecord = {
  endpoint: string
  keys: SavedPushSubscriptionKeys | null
  created_at?: string | null
  updated_at?: string | null
  user_agent?: string | null
  raw: Record<string, unknown>
}

export type RssSourceRecord = {
  source_id: string
  title?: string | null
  feed_url?: string | null
  site_url?: string | null
  status?: string | null
  last_error?: string | null
  last_error_at?: string | null
  last_fetched_at?: string | null
  subscribed_at?: string | null
  raw: Record<string, unknown>
}

export type FeedItemRecord = {
  item_id: string
  source_id: string
  source_title: string
  title: string
  published_at: string
  item_url: string | null
  read: boolean
  saved: boolean
}

export type FeedSummary = {
  total_count: number
  unread_count: number
}

export type FeedItemsResponse = {
  items: FeedItemRecord[]
  summary: FeedSummary
}

export type PushSupportState = {
  supported: boolean
  reason?: string
}

export type BrowserPushStatus = {
  localSubscription: PushSubscription | null
  localPayload: PushSubscriptionPayload | null
  matchedServerSubscription: SavedPushSubscriptionRecord | null
  serverHasCurrentBrowser: boolean
}

export type PushNotificationPayload = {
  title?: string
  body?: string
  url?: string
  sourceId?: string
  itemId?: number
}
