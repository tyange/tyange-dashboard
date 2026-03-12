import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router'
import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import { getGoogleClientId, loadGoogleIdentityScript, renderGoogleSignInButton } from '../auth/google'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ next?: string }>()
  const [userId, setUserId] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [isGoogleLoading, setIsGoogleLoading] = createSignal(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = createSignal(false)
  const [googleStatusMessage, setGoogleStatusMessage] = createSignal<string | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const googleClientId = getGoogleClientId()
  const isAnySubmitting = () => isSubmitting() || isGoogleSubmitting()
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

  const completePasswordLogin = async () => {
    if (isAnySubmitting()) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await auth.login(userId().trim(), password())
      finishLogin()
    } catch (error) {
      handleLoginError(error, '로그인 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  onMount(() => {
    if (!googleClientId) {
      setGoogleStatusMessage('Google 로그인을 사용하려면 클라이언트 설정이 필요해요.')
      return
    }

    if (!googleButtonContainer) {
      setGoogleStatusMessage('Google 로그인 버튼을 준비하지 못했어요. 새로고침 후 다시 시도해주세요.')
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
              setErrorMessage('Google 로그인 정보를 확인하지 못했어요. 다시 시도해주세요.')
              return
            }

            setIsGoogleSubmitting(true)
            setErrorMessage(null)

            try {
              await auth.loginWithGoogle(response.credential)
              finishLogin()
            } catch (error) {
              handleLoginError(error, 'Google 로그인에 실패했어요. 잠시 후 다시 시도해주세요.')
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

        const message = error instanceof Error ? error.message : 'Google 로그인 준비에 실패했어요. 잠시 후 다시 시도해주세요.'
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
        <section class="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-20 md:px-8">
          <div class="mx-auto w-full max-w-lg">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Login</p>

            <form
              class="mt-8 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                await completePasswordLogin()
              }}
            >
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">아이디</span>
                <input
                  type="text"
                  value={userId()}
                  onInput={(event) => setUserId(event.currentTarget.value)}
                  placeholder="user_id"
                  disabled={isAnySubmitting()}
                  class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">비밀번호</span>
                <input
                  type="password"
                  value={password()}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                  placeholder="••••••••"
                  disabled={isAnySubmitting()}
                  class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </label>
              <Show when={errorMessage()}>
                {(message) => (
                  <div class="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {message()}
                  </div>
                )}
              </Show>
              <div class="pt-2">
                <div class="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                  <span class="h-px flex-1 bg-border" />
                  <span>또는</span>
                  <span class="h-px flex-1 bg-border" />
                </div>
                <div class="relative mt-4 min-h-[52px]">
                  <div ref={googleButtonContainer} class="flex min-h-[52px] w-full items-center justify-center" />
                  <Show when={isGoogleLoading()}>
                    <div class="absolute inset-0 flex items-center justify-center px-4 text-sm text-muted-foreground">
                      Google 로그인 준비 중...
                    </div>
                  </Show>
                  <Show when={isGoogleSubmitting()}>
                    <div class="absolute inset-0 flex items-center justify-center px-4 text-sm font-medium text-foreground">
                      Google 계정을 확인하는 중...
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
              <div class="mt-8 flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <A href="/" class="text-sm font-medium text-accent transition-colors hover:text-foreground">
                    메인으로
                  </A>
                  <A href={`/signup?next=${encodeURIComponent(nextPath())}`} class="text-sm font-medium text-accent transition-colors hover:text-foreground">
                    회원가입
                  </A>
                </div>
                <button
                  type="submit"
                  disabled={isAnySubmitting()}
                  class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  {isSubmitting() ? '로그인 중...' : '로그인하기'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Show>
  )
}
