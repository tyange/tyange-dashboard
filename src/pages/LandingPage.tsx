import { A } from '@solidjs/router'
import { Show } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'

export default function LandingPage() {
  const auth = useAuth()

  return (
    <main class="relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,150,255,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(54,211,153,0.18),transparent_24%)]" />
      <section class="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-20 md:px-8">
        <div class="mx-auto w-full max-w-lg">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Tyange Dashboard</p>
          <h1 class="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            아무거나 확인하세요. 그냥, 다.
          </h1>

          <div class="mt-8 flex justify-end">
            <Show
              when={auth.isAuthenticated()}
              fallback={
                <A
                  href="/login?next=%2Fdashboard"
                  class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  로그인하기
                </A>
              }
            >
              <A
                href="/dashboard"
                class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  대시보드로 이동
                </A>
              </Show>
          </div>
        </div>
      </section>
    </main>
  )
}
