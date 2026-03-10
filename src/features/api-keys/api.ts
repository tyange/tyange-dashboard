import { createAuthorizedHeaders, getApiBaseUrl, getRequiredAccessToken } from '../../auth/api'
import type { ApiKeyListResponse, CreateApiKeyResponse } from './types'

const apiBaseUrl = getApiBaseUrl()

export async function fetchApiKeys() {
  const response = await fetch(`${apiBaseUrl}/api-keys`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || 'API 키 목록 조회 실패'}`)
  }

  return (await response.json()) as ApiKeyListResponse
}

export async function createApiKey(name: string) {
  const response = await fetch(`${apiBaseUrl}/api-keys`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || 'API 키 발급 실패'}`)
  }

  return (await response.json()) as CreateApiKeyResponse
}

export async function revokeApiKey(apiKeyId: number) {
  const response = await fetch(`${apiBaseUrl}/api-keys/${apiKeyId}`, {
    method: 'DELETE',
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || 'API 키 폐기 실패'}`)
  }
}
