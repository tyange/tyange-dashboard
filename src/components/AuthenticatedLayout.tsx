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
      location.pathname === path ? 'bg-white text-black' : 'text-white/78 hover:text-white'
    }`

  return (
    <>
      <nav
        aria-label="Authenticated navigation"
        class={`fixed left-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-2 backdrop-blur-xl transition-all duration-300 ease-out ${
          isScrolled() ? 'bg-black/80 shadow-lg shadow-black/30' : ''
        }`}
      >
        <A href="/dashboard" class={navLinkClass('/dashboard')}>
          예산
        </A>
        <A href="/budget/setup" class={navLinkClass('/budget/setup')}>
          예산 설정
        </A>
        <A href="/api-keys" class={navLinkClass('/api-keys')}>
          API 키
        </A>
        <Show when={auth.isAuthenticated()}>
          <button
            type="button"
            onClick={logout}
            class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            로그아웃
          </button>
        </Show>
      </nav>

      <main class="mx-auto w-full max-w-2xl flex-1 p-4 pt-24 md:p-8 md:pt-28">{props.children}</main>
    </>
  )
}
