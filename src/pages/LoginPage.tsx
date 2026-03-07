import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router'
import { Show } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ next?: string }>()

  const nextPath = () => {
    const requested = searchParams.next
    return requested && requested.startsWith('/') ? requested : '/dashboard'
  }

  const completeLogin = () => {
    auth.login(nextPath())
    void navigate(nextPath(), { replace: true })
  }

  return (
    <Show when={!auth.isAuthenticated()} fallback={<Navigate href={nextPath()} />}>
      <main class="relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,150,255,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(54,211,153,0.18),transparent_24%)]" />
        <section class="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-20 md:px-8">
          <div class="mx-auto w-full max-w-lg">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Login</p>

            <form
              class="mt-8 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                completeLogin()
              }}
            >
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">이메일</span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">비밀번호</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </label>
              <div class="mt-8 flex items-center justify-between gap-4">
                <A href="/" class="text-sm font-medium text-accent transition-colors hover:text-foreground">
                  메인으로
                </A>
                <button
                  type="submit"
                  class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  로그인하기
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Show>
  )
}
