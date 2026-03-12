import { createAuthorizedHeaders, getApiBaseUrl, getRequiredAccessToken } from '../../auth/api'
import { getApiErrorStatus } from '../budget/errors'
import type {
  ApiEnvelope,
  PushPublicKeyState,
  PushPublicKeyResponse,
  PushSubscriptionPayload,
  RssSourceRecord,
  SavedPushSubscriptionRecord,
} from './types'

const apiBaseUrl = getApiBaseUrl()

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' ? value : null
}

function readNullableString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  if (value == null) {
    return null
  }

  return typeof value === 'string' ? value : String(value)
}

function readStringId(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

async function getErrorMessage(response: Response, fallbackMessage: string) {
  const bodyText = await response.text()

  if (!bodyText) {
    return fallbackMessage
  }

  try {
    const payload = JSON.parse(bodyText) as { message?: string; statusMessage?: string }
    return payload.message || payload.statusMessage || bodyText
  } catch {
    return bodyText
  }
}

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as ApiEnvelope<T>).data ?? null) as T
  }

  return payload as T
}

async function fetchJsonOrThrow<T>(input: string, init: RequestInit, fallbackMessage: string): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const message = await getErrorMessage(response, fallbackMessage)
    throw new Error(`API ${response.status}: ${message}`)
  }

  return response.json() as Promise<T>
}

function getAuthHeaders(init?: HeadersInit) {
  return createAuthorizedHeaders(getRequiredAccessToken(), init)
}

function normalizePushSubscriptionRecord(value: unknown): SavedPushSubscriptionRecord | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const endpoint = readString(record, 'endpoint')
  if (!endpoint) {
    return null
  }

  const keysRecord = asRecord(record.keys)

  return {
    endpoint,
    keys: keysRecord
      ? {
          p256dh: readNullableString(keysRecord, 'p256dh'),
          auth: readNullableString(keysRecord, 'auth'),
        }
      : null,
    created_at: readNullableString(record, 'created_at'),
    updated_at: readNullableString(record, 'updated_at'),
    user_agent: readNullableString(record, 'user_agent'),
    raw: record,
  }
}

function isSavedPushSubscriptionRecord(value: SavedPushSubscriptionRecord | null): value is SavedPushSubscriptionRecord {
  return value !== null
}

function normalizeRssSourceRecord(value: unknown): RssSourceRecord | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const sourceId = readStringId(record, ['source_id', 'id'])
  if (!sourceId) {
    return null
  }

  return {
    source_id: sourceId,
    title: readNullableString(record, 'title') ?? readNullableString(record, 'name'),
    feed_url: readNullableString(record, 'feed_url') ?? readNullableString(record, 'url'),
    site_url: readNullableString(record, 'site_url') ?? readNullableString(record, 'homepage_url'),
    status: readNullableString(record, 'status') ?? readNullableString(record, 'last_status'),
    last_error: readNullableString(record, 'last_error') ?? readNullableString(record, 'error_message'),
    last_error_at: readNullableString(record, 'last_error_at'),
    last_fetched_at: readNullableString(record, 'last_fetched_at') ?? readNullableString(record, 'updated_at'),
    subscribed_at: readNullableString(record, 'subscribed_at') ?? readNullableString(record, 'created_at'),
    raw: record,
  }
}

function isRssSourceRecord(value: RssSourceRecord | null): value is RssSourceRecord {
  return value !== null
}

export async function fetchPushPublicKey(): Promise<string> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<PushPublicKeyResponse | ApiEnvelope<PushPublicKeyResponse>>(
      `${apiBaseUrl}/push/public-key`,
      {
        headers: getAuthHeaders(),
      },
      '푸시 공개 키 조회 실패',
    ),
  )

  return payload.public_key
}

export async function fetchPushPublicKeyState(): Promise<PushPublicKeyState> {
  try {
    const publicKey = await fetchPushPublicKey()
    return {
      availability: 'available',
      publicKey,
    }
  } catch (error) {
    if (getApiErrorStatus(error) === 503) {
      return {
        availability: 'unavailable',
        publicKey: null,
      }
    }

    return {
      availability: 'error',
      publicKey: null,
      error: error instanceof Error ? error : new Error('푸시 공개 키 조회 실패'),
    }
  }
}

export async function fetchSavedPushSubscriptions(): Promise<SavedPushSubscriptionRecord[]> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<unknown[] | ApiEnvelope<unknown[]>>(
      `${apiBaseUrl}/push/subscriptions`,
      {
        headers: getAuthHeaders(),
      },
      '브라우저 푸시 구독 조회 실패',
    ),
  )

  return Array.isArray(payload) ? payload.map(normalizePushSubscriptionRecord).filter(isSavedPushSubscriptionRecord) : []
}

export async function savePushSubscription(payload: PushSubscriptionPayload): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/push/subscriptions`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, '브라우저 푸시 구독 저장 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/push/subscriptions`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ endpoint }),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, '브라우저 푸시 구독 해제 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }
}

export async function fetchRssSources(): Promise<RssSourceRecord[]> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<unknown[] | ApiEnvelope<unknown[]>>(
      `${apiBaseUrl}/rss-sources`,
      {
        headers: getAuthHeaders(),
      },
      'RSS 구독 목록 조회 실패',
    ),
  )

  return Array.isArray(payload) ? payload.map(normalizeRssSourceRecord).filter(isRssSourceRecord) : []
}

export async function subscribeRssSource(feedUrl: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/rss-sources`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ feed_url: feedUrl }),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, 'RSS 구독 추가 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }
}

export async function unsubscribeRssSource(sourceId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/rss-sources/${sourceId}/subscription`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, 'RSS 구독 해제 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }
}
