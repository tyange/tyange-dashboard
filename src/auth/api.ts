const AUTH_STORAGE_KEY = 'tyange-dashboard.auth'

export type LoginPayload = {
  user_id: string
  password: string
}

export type GoogleLoginPayload = {
  id_token: string
}

export type AuthTokenResponse = {
  access_token: string
  refresh_token: string
  user_role: string
}

export type MeResponse = {
  user_id: string
  user_role: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
}

export type AuthSession = AuthTokenResponse & {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
}

export type UpdateMyProfilePayload = {
  display_name: string
  avatar_url: string
  bio: string
}

type SignupResponse = {
  status: boolean
  data: null
  message?: string | null
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_CMS_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
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

async function createAuthSession(tokens: AuthTokenResponse): Promise<AuthSession> {
  const me = await fetchMe(tokens.access_token)

  return {
    ...tokens,
    user_id: me.user_id,
    display_name: me.display_name,
    avatar_url: me.avatar_url,
    bio: me.bio,
  }
}

async function requestAuthTokens<TPayload>(options: {
  endpoint: string
  payload: TPayload
  fallbackMessage: string
  networkErrorMessage?: string
  statusMessages?: Partial<Record<number, string>>
}) {
  const { endpoint, payload, fallbackMessage, networkErrorMessage, statusMessages } = options

  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (networkErrorMessage) {
      throw new Error(networkErrorMessage)
    }

    throw error
  }

  if (!response.ok) {
    const fallback = statusMessages?.[response.status] ?? fallbackMessage
    const message = statusMessages?.[response.status] ?? (await readErrorMessage(response, fallback))
    throw new Error(`API ${response.status}: ${message}`)
  }

  return (await response.json()) as AuthTokenResponse
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

export async function updateMyProfile(accessToken: string, payload: UpdateMyProfilePayload): Promise<MeResponse> {
  const response = await fetch(`${getApiBaseUrl()}/me/profile`, {
    method: 'PUT',
    headers: createAuthorizedHeaders(accessToken, {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '프로필 저장 실패'}`)
  }

  return response.json()
}

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  const tokens = await requestAuthTokens({
    endpoint: '/login',
    payload,
    fallbackMessage: '로그인 실패',
  })

  return createAuthSession(tokens)
}

export async function googleLoginRequest(payload: GoogleLoginPayload): Promise<AuthSession> {
  const tokens = await requestAuthTokens({
    endpoint: '/login/google',
    payload,
    fallbackMessage: 'Google 로그인에 실패했어요. 잠시 후 다시 시도해주세요.',
    networkErrorMessage: '네트워크 상태를 확인한 뒤 다시 시도해주세요.',
    statusMessages: {
      401: 'Google 계정을 확인할 수 없어요. 다시 시도해주세요.',
      409: '이미 다른 방식으로 연결된 계정입니다. 기존 로그인 방법을 사용해주세요.',
    },
  })

  return createAuthSession(tokens)
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
