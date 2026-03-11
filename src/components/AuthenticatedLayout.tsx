import { A, useLocation, useNavigate } from '@solidjs/router'
import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import type { ParentProps } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'

export default function AuthenticatedLayout(props: ParentProps) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = createSignal(false)

  onMount(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    onCleanup(() => {
      window.removeEventListener('scroll', handleScroll)
    })
  })

  const logout = () => {
    auth.logout()
    void navigate('/')
  }

  const navLinkClass = (path: string) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
      location.pathname === path
        ? 'bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.08)]'
        : 'text-white/68 hover:bg-white/6 hover:text-white'
    }`

  return (
    <>
      <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div class="fixed left-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-40 w-full max-w-6xl -translate-x-1/2 px-4 md:px-8">
          <nav
            aria-label="Authenticated navigation"
            class={`flex w-full items-center justify-between gap-3 rounded-[1.5rem] border border-white/8 bg-black/45 px-3 py-2.5 backdrop-blur-2xl transition-all duration-300 ease-out ${
              isScrolled() ? 'border-white/10 bg-black/70 shadow-[0_18px_40px_rgba(0,0,0,0.35)]' : ''
            }`}
          >
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              <A href="/dashboard" class={navLinkClass('/dashboard')}>
                예산
              </A>
              <A href="/records" class={navLinkClass('/records')}>
                소비 기록
              </A>
              <A href="/budget/setup" class={navLinkClass('/budget/setup')}>
                예산 설정
              </A>
              <A href="/api-keys" class={navLinkClass('/api-keys')}>
                API 키
              </A>
            </div>
            <Show when={auth.isAuthenticated()}>
              <button
                type="button"
                onClick={logout}
                class="shrink-0 rounded-full border border-white/8 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/6 hover:text-white"
              >
                로그아웃
              </button>
            </Show>
          </nav>
        </div>

        <main class="w-full flex-1 pt-28 md:pt-32">{props.children}</main>
      </div>
    </>
  )
}
