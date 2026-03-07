import { createContext, createSignal, onMount, useContext } from 'solid-js'
import type { JSX, ParentProps } from 'solid-js'

export type AuthStatus = 'unknown' | 'guest' | 'authenticated'

export type AuthContextValue = {
  status: () => AuthStatus
  isAuthenticated: () => boolean
  login: (nextPath?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>()

export function AuthProvider(props: ParentProps): JSX.Element {
  const [status, setStatus] = createSignal<AuthStatus>('unknown')

  onMount(() => {
    setStatus('guest')
  })

  const value: AuthContextValue = {
    status,
    isAuthenticated: () => status() === 'authenticated',
    login: () => setStatus('authenticated'),
    logout: () => setStatus('guest'),
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
