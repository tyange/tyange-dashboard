export type ApiKeyRecord = {
  id: number
  name: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export type ApiKeyListResponse = {
  api_keys: ApiKeyRecord[]
}

export type CreateApiKeyResponse = ApiKeyRecord & {
  api_key: string
}
