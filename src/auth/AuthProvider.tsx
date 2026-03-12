import { createContext, createSignal, onMount, useContext } from 'solid-js'
import type { JSX, ParentProps } from 'solid-js'
import {
  clearStoredSession,
  fetchMe,
  googleLoginRequest,
  loadStoredSession,
  loginRequest,
  storeSession,
  type AuthSession,
} from './api'

export type AuthStatus = 'unknown' | 'guest' | 'authenticated'

export type AuthContextValue = {
  status: () => AuthStatus
  isAuthenticated: () => boolean
  session: () => AuthSession | null
  login: (userId: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>()

export function AuthProvider(props: ParentProps): JSX.Element {
  const [status, setStatus] = createSignal<AuthStatus>('unknown')
  const [session, setSession] = createSignal<AuthSession | null>(null)

  const applyAuthenticatedSession = (nextSession: AuthSession) => {
    storeSession(nextSession)
    setSession(nextSession)
    setStatus('authenticated')
  }

  onMount(() => {
    const storedSession = loadStoredSession()

    if (!storedSession) {
      setStatus('guest')
      return
    }

    void fetchMe(storedSession.access_token)
      .then((me) => {
        const nextSession: AuthSession = {
          ...storedSession,
          user_id: me.user_id,
          user_role: me.user_role,
        }

        applyAuthenticatedSession(nextSession)
      })
      .catch(() => {
        clearStoredSession()
        setSession(null)
        setStatus('guest')
      })
  })

  const value: AuthContextValue = {
    status,
    session,
    isAuthenticated: () => status() === 'authenticated',
    login: async (userId, password) => {
      const nextSession = await loginRequest({ user_id: userId, password })
      applyAuthenticatedSession(nextSession)
    },
    loginWithGoogle: async (idToken) => {
      const nextSession = await googleLoginRequest({ id_token: idToken })
      applyAuthenticatedSession(nextSession)
    },
    logout: () => {
      clearStoredSession()
      setSession(null)
      setStatus('guest')
    },
  }

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('AuthProvider is required')
  }

  return context
}
