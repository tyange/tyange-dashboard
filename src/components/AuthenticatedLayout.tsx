import { A, useLocation, useNavigate } from '@solidjs/router'
import { For, Show } from 'solid-js'
import type { ParentProps } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'
import { buildProfileViewModel, toProfileHref } from '../features/match/presentation'
import ThemeToggle from './ThemeToggle'

export default function AuthenticatedLayout(props: ParentProps) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { href: '/dashboard', label: '타임라인' },
    { href: '/settings', label: '설정' },
  ] as const

  const logout = () => {
    auth.logout()
    void navigate('/')
  }

  const currentUserId = () => auth.session()?.user_id ?? ''
  const currentProfile = () =>
    buildProfileViewModel(currentUserId(), currentUserId(), {
      displayName: auth.session()?.display_name,
      avatarUrl: auth.session()?.avatar_url,
      bio: auth.session()?.bio,
    })

  const navLinkClass = (path: string) =>
    `inline-flex h-9 items-center justify-center border-b-2 px-1 text-sm font-semibold transition-colors ${
      location.pathname === path
        ? 'border-foreground text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`

  return (
    <div class="mx-auto w-full max-w-[56rem] px-4 md:px-6">
      <header class="sticky top-0 z-40 bg-background/92 backdrop-blur-xl">
        <div class="flex items-center justify-between gap-3 py-3 pt-[calc(env(safe-area-inset-top)+0.85rem)]">
          <nav aria-label="Authenticated navigation" class="flex flex-wrap items-center gap-6">
            <For each={navItems}>
              {(item) => (
                <A href={item.href} class={navLinkClass(item.href)}>
                  {item.label}
                </A>
              )}
            </For>
          </nav>

          <div class="flex items-center gap-2">
            <Show when={auth.isAuthenticated()}>
              <A
                href={toProfileHref(currentUserId())}
                class="inline-flex h-9 items-center justify-center rounded-full border border-border/70 px-3 text-sm font-medium text-foreground transition hover:border-foreground/20 md:hidden"
                aria-label={`${currentProfile().handle} 프로필`}
              >
                <Show
                  when={currentProfile().avatarUrl}
                  fallback={<span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">{currentProfile().initials}</span>}
                >
                  {(avatarUrl) => <img src={avatarUrl()} alt="" class="h-6 w-6 rounded-full object-cover" />}
                </Show>
              </A>
            </Show>

            <Show when={auth.isAuthenticated()}>
              <A
                href={toProfileHref(currentUserId())}
                class="hidden items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-foreground/20 md:inline-flex"
              >
                <Show
                  when={currentProfile().avatarUrl}
                  fallback={<span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">{currentProfile().initials}</span>}
                >
                  {(avatarUrl) => <img src={avatarUrl()} alt="" class="h-7 w-7 rounded-full object-cover" />}
                </Show>
                <span class="max-w-[10rem] truncate">{currentProfile().handle}</span>
              </A>
            </Show>

            <ThemeToggle />
            <Show when={auth.isAuthenticated()}>
              <button
                type="button"
                onClick={logout}
                class="inline-flex h-9 items-center justify-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                로그아웃
              </button>
            </Show>
          </div>
        </div>
      </header>

      <main class="w-full pb-12 pt-4 md:pt-5 lg:pt-6">{props.children}</main>
    </div>
  )
}
