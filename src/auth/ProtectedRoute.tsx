import { Navigate, useLocation } from '@solidjs/router'
import { Match, Switch } from 'solid-js'
import type { ParentProps } from 'solid-js'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute(props: ParentProps) {
  const auth = useAuth()
  const location = useLocation()

  const nextPath = () => `${location.pathname}${location.search}${location.hash}`
  const loginHref = () => `/login?next=${encodeURIComponent(nextPath())}`

  return (
    <Switch>
      <Match when={auth.status() === 'unknown'}>
        <main class="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
          <div class="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
            잠시만요…
          </div>
        </main>
      </Match>
      <Match when={auth.isAuthenticated()}>{props.children}</Match>
      <Match when>
        <Navigate href={loginHref()} />
      </Match>
    </Switch>
  )
}
