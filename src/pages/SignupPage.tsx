import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router'
import { Show, createSignal } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'
import { signupRequest } from '../auth/api'
import ThemeToggle from '../components/ThemeToggle'

const MIN_PASSWORD_LENGTH = 8

export default function SignupPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ next?: string }>()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [passwordConfirm, setPasswordConfirm] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  const nextPath = () => {
    const requested = searchParams.next
    return requested && requested.startsWith('/') ? requested : '/dashboard'
  }

  const validateForm = () => {
    if (!email().trim()) {
      return '이메일을 입력해주세요.'
    }

    if (password().length < MIN_PASSWORD_LENGTH) {
      return `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`
    }

    if (password() !== passwordConfirm()) {
      return '비밀번호 확인이 일치하지 않습니다.'
    }

    return null
  }

  const completeSignup = async () => {
    if (isSubmitting()) {
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage(null)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const normalizedEmail = email().trim()

    try {
      const signupResult = await signupRequest(normalizedEmail, password())
      setSuccessMessage(signupResult.message ?? '회원가입이 완료되었습니다.')
      await auth.login(normalizedEmail, password())
      void navigate(nextPath(), { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입 실패'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Show when={!auth.isAuthenticated()} fallback={<Navigate href={nextPath()} />}>
      <main class="relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,150,255,0.24),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(54,211,153,0.18),transparent_24%)]" />
        <div class="absolute right-4 top-4 z-10 md:right-8 md:top-8">
          <ThemeToggle />
        </div>
        <section class="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-20 md:px-8">
          <div class="mx-auto w-full max-w-lg">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Signup</p>

            <form
              class="mt-8 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                await completeSignup()
              }}
            >
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">이메일</span>
                <input
                  type="email"
                  value={email()}
                  onInput={(event) => setEmail(event.currentTarget.value)}
                  placeholder="name@example.com"
                  class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">비밀번호</span>
                <input
                  type="password"
                  value={password()}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                  placeholder="최소 8자"
                  class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-foreground">비밀번호 확인</span>
                <input
                  type="password"
                  value={passwordConfirm()}
                  onInput={(event) => setPasswordConfirm(event.currentTarget.value)}
                  placeholder="비밀번호를 다시 입력"
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
              <Show when={successMessage()}>
                {(message) => (
                  <div class="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {message()}
                  </div>
                )}
              </Show>
              <div class="mt-8 flex items-center justify-between gap-4">
                <A href="/login" class="text-sm font-medium text-accent transition-colors hover:text-foreground">
                  로그인으로
                </A>
                <button
                  type="submit"
                  disabled={isSubmitting()}
                  class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  {isSubmitting() ? '가입 중...' : '회원가입'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Show>
  )
}
