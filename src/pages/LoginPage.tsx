import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router'
import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import ThemeToggle from '../components/ThemeToggle'
import { getGoogleClientId, loadGoogleIdentityScript, renderGoogleSignInButton } from '../auth/google'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ next?: string }>()
  const [isGoogleLoading, setIsGoogleLoading] = createSignal(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = createSignal(false)
  const [googleStatusMessage, setGoogleStatusMessage] = createSignal<string | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const googleClientId = getGoogleClientId()
  const isAnySubmitting = () => isGoogleSubmitting()
  let googleButtonContainer: HTMLDivElement | undefined

  const nextPath = () => {
    const requested = searchParams.next
    return requested && requested.startsWith('/') ? requested : '/dashboard'
  }

  const finishLogin = () => {
    void navigate(nextPath(), { replace: true })
  }

  const handleLoginError = (error: unknown, fallbackMessage: string) => {
    const message = error instanceof Error ? error.message : fallbackMessage
    setErrorMessage(message)
  }

  onMount(() => {
    if (!googleClientId) {
      setGoogleStatusMessage('Google 로그인이 아직 준비되지 않았어요.')
      return
    }

    if (!googleButtonContainer) {
      setGoogleStatusMessage('Google 로그인 버튼을 불러오지 못했어요. 새로고침해 주세요.')
      return
    }

    let disposed = false
    let cleanupGoogleButton: (() => void) | undefined

    setIsGoogleLoading(true)
    setGoogleStatusMessage(null)

    void loadGoogleIdentityScript()
      .then(() => {
        if (disposed || !googleButtonContainer) {
          return
        }

        cleanupGoogleButton = renderGoogleSignInButton({
          clientId: googleClientId,
          container: googleButtonContainer,
          onCredential: async (response) => {
            if (isAnySubmitting()) {
              return
            }

            if (!response.credential?.trim()) {
              setErrorMessage('Google 로그인 정보를 확인하지 못했어요. 다시 시도해 주세요.')
              return
            }

            setIsGoogleSubmitting(true)
            setErrorMessage(null)

            try {
              await auth.loginWithGoogle(response.credential)
              finishLogin()
            } catch (error) {
              handleLoginError(error, 'Google 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.')
            } finally {
              setIsGoogleSubmitting(false)
            }
          },
        })

        setGoogleStatusMessage(null)
      })
      .catch((error) => {
        if (disposed) {
          return
        }

        const message = error instanceof Error ? error.message : 'Google 로그인 준비에 실패했어요. 잠시 후 다시 시도해 주세요.'
        setGoogleStatusMessage(message)
      })
      .finally(() => {
        if (!disposed) {
          setIsGoogleLoading(false)
        }
      })

    onCleanup(() => {
      disposed = true
      cleanupGoogleButton?.()
    })
  })

  return (
    <Show when={!auth.isAuthenticated()} fallback={<Navigate href={nextPath()} />}>
      <main class="relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,150,255,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(54,211,153,0.18),transparent_24%)]" />
        <div class="absolute right-4 top-4 z-10 md:right-8 md:top-8">
          <ThemeToggle />
        </div>
        <section class="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-20 md:px-8">
          <div class="mx-auto w-full max-w-lg">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Login</p>
            <div class="mt-8 space-y-6 rounded-[2rem] border border-border/70 bg-background/70 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
              <h1 class="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Google 계정으로 로그인</h1>
              <Show when={errorMessage()}>
                {(message) => (
                  <div class="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {message()}
                  </div>
                )}
              </Show>
              <Show
                when={googleClientId}
                fallback={
                  <Show when={googleStatusMessage()}>
                    {(message) => (
                      <p class="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {message()}
                      </p>
                    )}
                  </Show>
                }
              >
                <div class="pt-1">
                  <div class="relative min-h-[52px]">
                    <div ref={googleButtonContainer} class="flex min-h-[52px] w-full items-center justify-center" />
                    <Show when={isGoogleLoading()}>
                      <div class="absolute inset-0 flex items-center justify-center px-4 text-sm text-muted-foreground">
                        Google 로그인 준비 중…
                      </div>
                    </Show>
                    <Show when={isGoogleSubmitting()}>
                      <div class="absolute inset-0 flex items-center justify-center px-4 text-sm font-medium text-foreground">
                        Google 계정 확인 중…
                      </div>
                    </Show>
                  </div>
                  <Show when={googleStatusMessage()}>
                    {(message) => (
                      <p class="mt-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {message()}
                      </p>
                    )}
                  </Show>
                </div>
              </Show>
              <div class="flex items-center justify-between gap-4 pt-2">
                <A href="/" class="text-sm font-medium text-accent transition-colors hover:text-foreground">
                  메인으로
                </A>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Show>
  )
}
