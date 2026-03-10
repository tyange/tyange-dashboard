const AUTH_STORAGE_KEY = 'tyange-dashboard.auth'

export type LoginPayload = {
  user_id: string
  password: string
}

export type LoginResponse = {
  access_token: string
  refresh_token: string
  user_role: string
}

export type MeResponse = {
  user_id: string
  user_role: string
}

export type AuthSession = LoginResponse & {
  user_id: string
}

type SignupResponse = {
  status: boolean
  data: null
  message?: string | null
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_CMS_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
}

export function loadStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function storeSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function createAuthorizedHeaders(accessToken: string, init?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/json',
    ...init,
    Authorization: accessToken,
  }
}

export function getRequiredAccessToken() {
  const session = loadStoredSession()

  if (!session?.access_token) {
    throw new Error('로그인이 필요합니다.')
  }

  return session.access_token
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${getApiBaseUrl()}/me`, {
    headers: createAuthorizedHeaders(accessToken),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '사용자 정보 조회 실패'}`)
  }

  return response.json()
}

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  const response = await fetch(`${getApiBaseUrl()}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '로그인 실패'}`)
  }

  const tokens = (await response.json()) as LoginResponse
  const me = await fetchMe(tokens.access_token)

  return {
    ...tokens,
    user_id: me.user_id,
  }
}

export async function signupRequest(email: string, password: string): Promise<SignupResponse> {
  const response = await fetch(`${getApiBaseUrl()}/signup`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '회원가입 실패'}`)
  }

  return response.json()
}
