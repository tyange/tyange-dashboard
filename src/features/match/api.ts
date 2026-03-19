import { createAuthorizedHeaders, getApiBaseUrl, getRequiredAccessToken } from '../../auth/api'
import type { ApiEnvelope, MatchMessage, MatchMessagesResponse, MatchSummary } from './types'

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

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
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

function normalizeMatchSummary(value: unknown): MatchSummary | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const matchId = readNumber(record, 'match_id')
  const status = readString(record, 'status')
  const requesterUserId = readString(record, 'requester_user_id')
  const targetUserId = readString(record, 'target_user_id')
  const counterpartUserId = readString(record, 'counterpart_user_id')
  const createdAt = readString(record, 'created_at')

  if (
    matchId === null ||
    !status ||
    !requesterUserId ||
    !targetUserId ||
    !counterpartUserId ||
    !createdAt
  ) {
    return null
  }

  return {
    match_id: matchId,
    status,
    requester_user_id: requesterUserId,
    target_user_id: targetUserId,
    counterpart_user_id: counterpartUserId,
    created_at: createdAt,
    responded_at: readNullableString(record, 'responded_at'),
  }
}

function normalizeMatchMessage(value: unknown): MatchMessage | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const messageId = readNumber(record, 'message_id')
  const matchId = readNumber(record, 'match_id')
  const senderUserId = readString(record, 'sender_user_id')
  const receiverUserId = readString(record, 'receiver_user_id')
  const content = readString(record, 'content')
  const createdAt = readString(record, 'created_at')

  if (messageId === null || matchId === null || !senderUserId || !receiverUserId || !content || !createdAt) {
    return null
  }

  return {
    message_id: messageId,
    match_id: matchId,
    sender_user_id: senderUserId,
    receiver_user_id: receiverUserId,
    content,
    created_at: createdAt,
  }
}

export async function fetchMyMatch(): Promise<MatchSummary | null> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<MatchSummary | ApiEnvelope<MatchSummary | null>>(
      `${apiBaseUrl}/match/me`,
      {
        headers: getAuthHeaders(),
      },
      '현재 매칭 조회 실패',
    ),
  )

  return normalizeMatchSummary(payload)
}

export async function createMatch(targetUserId: string): Promise<MatchSummary> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<MatchSummary | ApiEnvelope<MatchSummary>>(
      `${apiBaseUrl}/match/request`,
      {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          target_user_id: targetUserId,
        }),
      },
      '매칭 신청 실패',
    ),
  )

  const normalized = normalizeMatchSummary(payload)
  if (!normalized) {
    throw new Error('API 응답 형식이 올바르지 않습니다.')
  }

  return normalized
}

export async function respondMatch(matchId: number, action: 'accept' | 'reject'): Promise<MatchSummary> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<MatchSummary | ApiEnvelope<MatchSummary>>(
      `${apiBaseUrl}/match/${matchId}/respond`,
      {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action }),
      },
      '매칭 응답 실패',
    ),
  )

  const normalized = normalizeMatchSummary(payload)
  if (!normalized) {
    throw new Error('API 응답 형식이 올바르지 않습니다.')
  }

  return normalized
}

export async function deleteMyMatch(): Promise<MatchSummary | null> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<MatchSummary | ApiEnvelope<MatchSummary | null>>(
      `${apiBaseUrl}/match/me`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      },
      '매칭 상태 변경 실패',
    ),
  )

  return normalizeMatchSummary(payload)
}

export async function fetchMatchMessages(): Promise<MatchMessagesResponse> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<MatchMessagesResponse | ApiEnvelope<MatchMessagesResponse>>(
      `${apiBaseUrl}/match/messages`,
      {
        headers: getAuthHeaders(),
      },
      '메시지 목록 조회 실패',
    ),
  )

  const record = asRecord(payload)
  if (!record) {
    throw new Error('API 응답 형식이 올바르지 않습니다.')
  }

  const matchId = readNumber(record, 'match_id')
  const counterpartUserId = readString(record, 'counterpart_user_id')
  const messages = Array.isArray(record.messages) ? record.messages.map(normalizeMatchMessage).filter(Boolean) : null

  if (matchId === null || !counterpartUserId || !messages) {
    throw new Error('API 응답 형식이 올바르지 않습니다.')
  }

  return {
    match_id: matchId,
    counterpart_user_id: counterpartUserId,
    messages: messages as MatchMessage[],
  }
}

export async function createMatchMessage(content: string): Promise<MatchMessage> {
  const payload = unwrapApiData(
    await fetchJsonOrThrow<MatchMessage | ApiEnvelope<MatchMessage>>(
      `${apiBaseUrl}/match/messages`,
      {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ content }),
      },
      '메시지 전송 실패',
    ),
  )

  const normalized = normalizeMatchMessage(payload)
  if (!normalized) {
    throw new Error('API 응답 형식이 올바르지 않습니다.')
  }

  return normalized
}
