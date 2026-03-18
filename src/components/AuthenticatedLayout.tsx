import { A, useLocation, useNavigate } from '@solidjs/router'
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import type { ParentProps } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'
import ThemeToggle from './ThemeToggle'

export default function AuthenticatedLayout(props: ParentProps) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = createSignal(false)
  const [menuOpen, setMenuOpen] = createSignal(false)

  const navItems = [
    { href: '/dashboard', label: '예산' },
    { href: '/records', label: '소비 기록' },
    { href: '/budget/setup', label: '예산 설정' },
    { href: '/api-keys', label: 'API 키' },
    { href: '/notifications', label: '알림' },
  ] as const

  onMount(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    handleScroll()
    handleResize()

    onCleanup(() => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    })
  })

  const logout = () => {
    setMenuOpen(false)
    auth.logout()
    void navigate('/')
  }

  const handleNavigate = () => {
    setMenuOpen(false)
  }

  const navLinkClass = (path: string) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
      location.pathname === path
        ? 'bg-foreground text-background shadow-[0_10px_24px_color-mix(in_srgb,var(--shadow-color)_16%,transparent)]'
        : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
    }`

  return (
    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <header class="sticky top-0 z-40 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div
          class={`rounded-[1.5rem] border border-border/70 bg-card/82 backdrop-blur-2xl transition-all duration-300 ease-out ${
            isScrolled() ? 'shadow-[0_18px_40px_color-mix(in_srgb,var(--shadow-color)_18%,transparent)]' : ''
          }`}
        >
          <nav
            aria-label="Authenticated navigation"
            class="flex items-center justify-between gap-3 px-3 py-3"
          >
            <div class="min-w-0 flex-1">
              <div class="hidden min-w-0 items-center gap-1 lg:flex">
                <For each={navItems}>
                  {(item) => (
                    <A href={item.href} class={navLinkClass(item.href)} onClick={handleNavigate}>
                      {item.label}
                    </A>
                  )}
                </For>
              </div>
              <div class="lg:hidden">
                <button
                  type="button"
                  aria-expanded={menuOpen()}
                  aria-controls="mobile-auth-nav"
                  onClick={() => setMenuOpen((current) => !current)}
                  class="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/82 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  메뉴
                </button>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <Show when={auth.isAuthenticated()}>
                <button
                  type="button"
                  onClick={logout}
                  class="shrink-0 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                >
                  로그아웃
                </button>
              </Show>
            </div>
          </nav>

          <Show when={menuOpen()}>
            <div
              id="mobile-auth-nav"
              class="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-[1.5rem] border border-border/80 bg-background/98 px-3 pb-3 pt-3 shadow-[0_22px_50px_color-mix(in_srgb,var(--shadow-color)_26%,transparent)] backdrop-blur-2xl lg:hidden"
            >
              <div class="grid gap-2 sm:grid-cols-2">
                <For each={navItems}>
                  {(item) => (
                    <A href={item.href} class={navLinkClass(item.href)} onClick={handleNavigate}>
                      {item.label}
                    </A>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </header>

      <main class="w-full flex-1 px-1.5 pt-8 md:px-3 md:pt-10">{props.children}</main>
    </div>
  )
}
