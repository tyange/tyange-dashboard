import { A } from '@solidjs/router'
import { Show } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'
import ThemeToggle from '../components/ThemeToggle'

export default function LandingPage() {
  const auth = useAuth()

  return (
    <main class="relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,150,255,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(54,211,153,0.18),transparent_24%)]" />
      <div class="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <section class="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-20 md:px-8">
        <div class="mx-auto w-full max-w-lg">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Tyange</p>
          <h1 class="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
<<<<<<< Updated upstream
            읽을 거리와 알림을 한곳에서 가볍게 확인하세요.
=======
            내 예산과 소비, 한눈에 관리하세요.
>>>>>>> Stashed changes
          </h1>
          <p class="mt-4 text-sm leading-6 text-muted-foreground">
            구독한 소스를 모아 보고, 필요한 브라우저 알림만 켜둘 수 있는 개인용 허브입니다.
          </p>

          <div class="mt-8 flex justify-end">
            <Show
              when={auth.isAuthenticated()}
              fallback={
                <div class="flex items-center gap-3">
                  <A
                    href="/signup?next=%2Fdashboard"
                    class="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
                  >
                    회원가입
                  </A>
                  <A
                    href="/login?next=%2Fdashboard"
                    class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    로그인하기
                  </A>
                </div>
              }
            >
              <A
                href="/dashboard"
                class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  새 글 보기
              </A>
            </Show>
          </div>
        </div>
      </section>
    </main>
  )
}
