import { useNavigate } from '@solidjs/router'
import { Show, createSignal, onMount } from 'solid-js'
import { fetchWeeklyConfig, saveWeeklyBudgetConfig } from '../api'

function toThresholdPercent(value: number) {
  return Math.round(value * 100)
}

function toThresholdRatio(value: number) {
  return value / 100
}

export default function BudgetSetupPage() {
  const navigate = useNavigate()
  const [weekKey, setWeekKey] = createSignal('-')
  const [weeklyLimitInput, setWeeklyLimitInput] = createSignal('')
  const [alertThresholdInput, setAlertThresholdInput] = createSignal('85')
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  onMount(() => {
    void fetchWeeklyConfig()
      .then((config) => {
        setWeekKey(config.week_key)
        setWeeklyLimitInput(String(config.weekly_limit))
        setAlertThresholdInput(String(toThresholdPercent(config.alert_threshold)))
      })
      .catch((error) => {
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const submit = async () => {
    if (saving()) {
      return
    }

    const weeklyLimit = Number(weeklyLimitInput())
    const alertThresholdPercent = Number(alertThresholdInput())

    if (!Number.isFinite(weeklyLimit) || weeklyLimit <= 0) {
      setErrorMessage('주간 예산은 0보다 큰 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (!Number.isFinite(alertThresholdPercent) || alertThresholdPercent < 0 || alertThresholdPercent > 100) {
      setErrorMessage('알림 기준은 0에서 100 사이의 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const result = await saveWeeklyBudgetConfig(weeklyLimit, toThresholdRatio(alertThresholdPercent))
      setSuccessMessage(result.message ?? '예산을 저장했습니다.')
      void navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const fieldClass =
    'w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary'

  return (
    <article aria-label="예산 설정 페이지">
      <header class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">예산 설정</h1>
        <p class="mt-1 text-sm text-muted-foreground">현재 주차 예산과 알림 기준을 대시보드에서 직접 저장합니다.</p>
      </header>

      <section class="rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]">
        <Show when={!loading()} fallback={<p class="text-sm text-muted-foreground">예산 설정을 불러오는 중...</p>}>
          <div class="mb-6 flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">대상 주차</p>
              <p class="mt-1 text-xl font-semibold text-foreground">{weekKey()}</p>
            </div>
            <button
              type="button"
              onClick={() => void navigate('/dashboard')}
              class="inline-flex items-center rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              취소
            </button>
          </div>

          <form
            class="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault()
              await submit()
            }}
          >
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-foreground">주간 예산</span>
              <input
                type="number"
                min="1"
                step="1000"
                inputmode="numeric"
                value={weeklyLimitInput()}
                onInput={(event) => setWeeklyLimitInput(event.currentTarget.value)}
                class={fieldClass}
                placeholder="예: 500000"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-foreground">알림 기준 (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                inputmode="numeric"
                value={alertThresholdInput()}
                onInput={(event) => setAlertThresholdInput(event.currentTarget.value)}
                class={fieldClass}
                placeholder="예: 85"
              />
              <p class="mt-2 text-xs text-muted-foreground">사용률이 이 값을 넘기면 경고 상태로 표시됩니다.</p>
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

            <div class="flex justify-end">
              <button
                type="submit"
                disabled={saving()}
                class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving() ? '저장 중...' : '예산 저장'}
              </button>
            </div>
          </form>
        </Show>
      </section>
    </article>
  )
}
