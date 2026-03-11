import { Popover } from '@kobalte/core/popover'
import { TextField } from '@kobalte/core/text-field'
import { useNavigate } from '@solidjs/router'
import { Show, createMemo, createSignal, onMount } from 'solid-js'
import { createBudgetPlan, fetchBudgetSummary, updateBudget } from '../api'
import { krwFormatter } from '../format'
import type { BudgetSummary } from '../types'

function toThresholdPercent(value: number) {
  return Math.round(value * 100)
}

function toThresholdRatio(value: number) {
  return value / 100
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function dateInputOnly(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

function isOverspent(summary: Pick<BudgetSummary, 'remaining_budget' | 'is_overspent'> | null) {
  if (!summary) return false
  return summary.is_overspent ?? summary.remaining_budget < 0
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
      <path
        d="M7 2v3M17 2v3M3.75 9.25h16.5M5 5.75h14a1.25 1.25 0 0 1 1.25 1.25v11A1.25 1.25 0 0 1 19 19.25H5A1.25 1.25 0 0 1 3.75 18V7A1.25 1.25 0 0 1 5 5.75Z"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.7"
      />
    </svg>
  )
}

type MoneyFieldProps = {
  label: string
  value: string
  placeholder: string
  onInput: (value: string) => void
  description?: string
}

function MoneyField(props: MoneyFieldProps) {
  return (
    <TextField class="block">
      <TextField.Label class="mb-2 block text-sm font-medium text-foreground">{props.label}</TextField.Label>
      <TextField.Input
        type="text"
        inputmode="numeric"
        autocomplete="off"
        value={props.value}
        onInput={(event) => props.onInput(digitsOnly(event.currentTarget.value))}
        class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
        placeholder={props.placeholder}
      />
      <Show when={props.description}>
        {(description) => <TextField.Description class="mt-2 text-xs text-muted-foreground">{description()}</TextField.Description>}
      </Show>
    </TextField>
  )
}

type PercentFieldProps = {
  value: string
  onInput: (value: string) => void
}

function PercentField(props: PercentFieldProps) {
  return (
    <TextField class="block">
      <TextField.Label class="mb-2 block text-sm font-medium text-foreground">알림 기준 (%)</TextField.Label>
      <TextField.Input
        type="number"
        min="0"
        max="100"
        step="1"
        inputmode="numeric"
        value={props.value}
        onInput={(event) => props.onInput(event.currentTarget.value)}
        class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
        placeholder="예: 85"
      />
      <TextField.Description class="mt-2 text-xs text-muted-foreground">
        사용률이 이 값을 넘기면 경고 상태로 표시됩니다.
      </TextField.Description>
    </TextField>
  )
}

type DateFieldProps = {
  label: string
  value: string
  onInput: (value: string) => void
}

function DateField(props: DateFieldProps) {
  const inputClass =
    'w-full rounded-2xl border border-border bg-background/70 px-4 py-3 pr-14 text-sm text-foreground outline-none transition focus:border-primary'

  return (
    <TextField class="block">
      <TextField.Label class="mb-2 block text-sm font-medium text-foreground">{props.label}</TextField.Label>
      <Popover placement="bottom-end">
        <div class="relative">
          <TextField.Input
            type="text"
            inputmode="numeric"
            autocomplete="off"
            value={props.value}
            onInput={(event) => props.onInput(dateInputOnly(event.currentTarget.value))}
            class={inputClass}
            placeholder="YYYY-MM-DD"
          />
          <Popover.Trigger
            class="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white/80 transition hover:bg-white/14 hover:text-white focus:outline-none"
            aria-label={`${props.label} 달력 열기`}
          >
            <CalendarIcon />
          </Popover.Trigger>
        </div>
        <Popover.Portal>
          <Popover.Content class="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-slate-950/96 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div class="mb-3 flex items-center justify-between">
              <Popover.Title class="text-sm font-semibold tracking-[0.01em] text-white">
                {props.label}
              </Popover.Title>
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                onClick={() => props.onInput(formatDateInput(new Date()))}
              >
                오늘
              </button>
            </div>
            <input
              type="date"
              value={props.value}
              onInput={(event) => props.onInput(event.currentTarget.value)}
              class="w-full rounded-xl border border-white/12 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-500"
            />
            <p class="mt-2 text-xs leading-5 text-white/58">직접 입력하거나 달력에서 날짜를 선택할 수 있습니다.</p>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </TextField>
  )
}

export default function BudgetSetupPage() {
  const navigate = useNavigate()
  const [hasActiveBudget, setHasActiveBudget] = createSignal(false)
  const [activeBudget, setActiveBudget] = createSignal<BudgetSummary | null>(null)
  const [totalBudgetInput, setTotalBudgetInput] = createSignal('')
  const [totalSpentInput, setTotalSpentInput] = createSignal('')
  const [fromDateInput, setFromDateInput] = createSignal('')
  const [toDateInput, setToDateInput] = createSignal('')
  const [alertThresholdInput, setAlertThresholdInput] = createSignal('85')
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  onMount(() => {
    void fetchBudgetSummary()
      .then((summary) => {
        setHasActiveBudget(true)
        setActiveBudget(summary)
        setTotalBudgetInput(String(summary.total_budget))
        setTotalSpentInput(String(summary.total_spent))
        setFromDateInput(summary.from_date)
        setToDateInput(summary.to_date)
        setAlertThresholdInput(String(toThresholdPercent(summary.alert_threshold)))
      })
      .catch((error) => {
        if ((error as Error).message.startsWith('API 404:')) {
          setHasActiveBudget(false)
          return
        }
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const submitBudget = async () => {
    if (saving()) return

    const totalBudget = Number(totalBudgetInput())
    const totalSpentValue = totalSpentInput().trim()
    const totalSpent = totalSpentValue === '' ? undefined : Number(totalSpentValue)
    const alertThresholdPercent = Number(alertThresholdInput())
    const fromDate = fromDateInput().trim()
    const toDate = toDateInput().trim()

    if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
      setErrorMessage('총예산은 0보다 큰 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (!Number.isFinite(alertThresholdPercent) || alertThresholdPercent < 0 || alertThresholdPercent > 100) {
      setErrorMessage('알림 기준은 0에서 100 사이의 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (totalSpent !== undefined && (!Number.isFinite(totalSpent) || totalSpent < 0)) {
      setErrorMessage('현재까지 지출 총액은 0 이상의 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (!hasActiveBudget() && (!fromDate || !toDate)) {
      setErrorMessage('시작일과 종료일을 모두 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (!hasActiveBudget() && fromDate > toDate) {
      setErrorMessage('시작일은 종료일보다 늦을 수 없습니다.')
      setSuccessMessage(null)
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const alertThreshold = toThresholdRatio(alertThresholdPercent)

      if (hasActiveBudget()) {
        const result = await updateBudget({
          total_budget: totalBudget,
          total_spent: totalSpent,
          alert_threshold: alertThreshold,
        })
        const updatedBudget = result.data ?? null

        if (updatedBudget) {
          setActiveBudget(updatedBudget)
          setTotalBudgetInput(String(updatedBudget.total_budget))
          setTotalSpentInput(String(updatedBudget.total_spent))
          setFromDateInput(updatedBudget.from_date)
          setToDateInput(updatedBudget.to_date)
          setAlertThresholdInput(String(toThresholdPercent(updatedBudget.alert_threshold)))
        }

        setSuccessMessage(result.message ?? '현재 활성 기간 예산을 수정했습니다.')
      } else {
        const result = await createBudgetPlan({
          total_budget: totalBudget,
          from_date: fromDate,
          to_date: toDate,
          total_spent: totalSpent,
          alert_threshold: alertThreshold,
        })
        setSuccessMessage(result.message ?? '예산을 생성했습니다.')
        void navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const panelClass = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const visibleBudget = createMemo(() => activeBudget())
  const overspentVisible = createMemo(() => isOverspent(visibleBudget()))

  return (
    <article aria-label="예산 설정 페이지">
      <header class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">예산 설정</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          활성 기간 예산이 있으면 총액을 수정하고, 없으면 새 기간 총예산을 생성합니다.
        </p>
      </header>

      <section class={panelClass}>
        <Show when={!loading()} fallback={<p class="text-sm text-muted-foreground">예산 설정을 불러오는 중...</p>}>
          <div class="mb-6 flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">{hasActiveBudget() ? '현재 활성 예산' : '새 예산 생성'}</p>
              <p class="mt-1 text-xl font-semibold text-foreground">
                {hasActiveBudget() ? '활성 기간 예산 총액 수정' : '활성 예산이 없습니다'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void navigate('/dashboard')}
              class="inline-flex items-center rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              취소
            </button>
          </div>

          <Show when={hasActiveBudget() && visibleBudget()}>
            {(budget) => (
              <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="rounded-2xl border border-border bg-background/60 p-4">
                  <p class="text-sm text-muted-foreground">활성 기간</p>
                  <p class="mt-1 text-lg font-semibold text-foreground">
                    {budget().from_date} ~ {budget().to_date}
                  </p>
                </div>
                <div class="rounded-2xl border border-border bg-background/60 p-4">
                  <p class="text-sm text-muted-foreground">총 지출</p>
                  <p class="mt-1 text-lg font-semibold text-foreground">{krwFormatter.format(budget().total_spent)}</p>
                </div>
                <div class="rounded-2xl border border-border bg-background/60 p-4">
                  <p class="text-sm text-muted-foreground">남은 총예산</p>
                  <p class={`mt-1 text-lg font-semibold ${overspentVisible() ? 'text-destructive' : 'text-foreground'}`}>
                    {krwFormatter.format(budget().remaining_budget)}
                  </p>
                </div>
              </div>
            )}
          </Show>

          <form
            class="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault()
              await submitBudget()
            }}
          >
            <MoneyField
              label={hasActiveBudget() ? '예산 총액 수정' : '총예산'}
              value={totalBudgetInput()}
              onInput={setTotalBudgetInput}
              placeholder="예: 2500000"
            />

            <MoneyField
              label="현재까지 지출 총액"
              value={totalSpentInput()}
              onInput={setTotalSpentInput}
              placeholder="예: 400000"
              description="이 값은 현재 budget 요약에 반영되는 누적 지출값입니다."
            />

            <Show
              when={!hasActiveBudget()}
              fallback={
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div class="rounded-2xl border border-border bg-background/60 p-4">
                    <p class="text-sm text-muted-foreground">활성 기간 시작일</p>
                    <p class="mt-1 text-lg font-semibold text-foreground">{fromDateInput() || '-'}</p>
                  </div>
                  <div class="rounded-2xl border border-border bg-background/60 p-4">
                    <p class="text-sm text-muted-foreground">활성 기간 종료일</p>
                    <p class="mt-1 text-lg font-semibold text-foreground">{toDateInput() || '-'}</p>
                  </div>
                  <div class="md:col-span-2 rounded-2xl border border-border bg-background/40 p-4">
                    <p class="text-sm text-muted-foreground">기간 안내</p>
                    <p class="mt-1 text-sm text-foreground">현재 활성 예산 수정에서는 기간을 바꿀 수 없습니다.</p>
                  </div>
                </div>
              }
            >
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DateField label="시작일" value={fromDateInput()} onInput={setFromDateInput} />
                <DateField label="종료일" value={toDateInput()} onInput={setToDateInput} />
              </div>
            </Show>

            <PercentField value={alertThresholdInput()} onInput={setAlertThresholdInput} />

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
            <Show when={overspentVisible()}>
              <div class="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                현재 활성 기간 예산이 초과 상태입니다. 총 지출이 총예산을 넘어섰습니다.
              </div>
            </Show>

            <div class="flex justify-end">
              <button
                type="submit"
                disabled={saving()}
                class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving() ? '저장 중...' : hasActiveBudget() ? '활성 예산 총액 수정' : '활성 예산 생성'}
              </button>
            </div>
          </form>
        </Show>
      </section>
    </article>
  )
}
