import { Popover } from '@kobalte/core/popover'
import { TextField } from '@kobalte/core/text-field'
import { useNavigate } from '@solidjs/router'
import { Show, createSignal, onMount } from 'solid-js'
import { createBudgetPlan, fetchBudgetSummary, updateBudget } from '../api'
import { getApiErrorStatus, isBudgetNotConfiguredError } from '../errors'
import { krwFormatter } from '../format'
import type { BudgetSummary } from '../types'
import { formatDateInput } from '../utils'

function toThresholdPercent(value: number) {
  return Math.round(value * 100)
}

function toThresholdRatio(value: number) {
  return value / 100
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

function getSaveErrorMessage(error: unknown) {
  const status = getApiErrorStatus(error)

  if (status === 401) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 404) {
    return '활성 예산이 없거나 수정할 예산을 찾지 못했습니다.'
  }

  return (error as Error).message
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
  disabled?: boolean
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
        disabled={props.disabled}
        onInput={(event) => props.onInput(digitsOnly(event.currentTarget.value))}
        class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
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
  disabled?: boolean
}

function DateField(props: DateFieldProps) {
  const inputClass =
    'w-full rounded-2xl border border-border bg-background/70 px-4 py-3 pr-14 text-sm text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-70'

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
            disabled={props.disabled}
            onInput={(event) => props.onInput(dateInputOnly(event.currentTarget.value))}
            class={inputClass}
            placeholder="YYYY-MM-DD"
          />
          <Popover.Trigger
            class="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white/80 transition hover:bg-white/14 hover:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={`${props.label} 달력 열기`}
            disabled={props.disabled}
          >
            <CalendarIcon />
          </Popover.Trigger>
        </div>
        <Popover.Portal>
          <Popover.Content class="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-slate-950/96 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div class="mb-3 flex items-center justify-between">
              <Popover.Title class="text-sm font-semibold tracking-[0.01em] text-white">{props.label}</Popover.Title>
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => props.onInput(formatDateInput(new Date()))}
                disabled={props.disabled}
              >
                오늘
              </button>
            </div>
            <input
              type="date"
              value={props.value}
              disabled={props.disabled}
              onInput={(event) => props.onInput(event.currentTarget.value)}
              class="w-full rounded-xl border border-white/12 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
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
  const [saveTotalBudgetInput, setSaveTotalBudgetInput] = createSignal('')
  const [saveFromDateInput, setSaveFromDateInput] = createSignal('')
  const [saveToDateInput, setSaveToDateInput] = createSignal('')
  const [alertThresholdInput, setAlertThresholdInput] = createSignal('85')
  const [saving, setSaving] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  onMount(() => {
    void fetchBudgetSummary()
      .then((summary) => {
        setHasActiveBudget(true)
        setActiveBudget(summary)
        setSaveTotalBudgetInput(String(summary.total_budget))
        setSaveFromDateInput(summary.from_date)
        setSaveToDateInput(summary.to_date)
        setAlertThresholdInput(String(toThresholdPercent(summary.alert_threshold)))
      })
      .catch((error) => {
        if (isBudgetNotConfiguredError(error)) {
          setHasActiveBudget(false)
          return
        }

        setErrorMessage(getSaveErrorMessage(error))
      })
  })

  const submitBudget = async () => {
    if (saving()) return

    const totalBudget = Number(saveTotalBudgetInput())
    const alertThresholdPercent = Number(alertThresholdInput())
    const fromDate = saveFromDateInput().trim()
    const toDate = saveToDateInput().trim()

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
          alert_threshold: alertThreshold,
        })
        const updatedBudget = result.data ?? null

        if (updatedBudget) {
          setActiveBudget(updatedBudget)
          setSaveTotalBudgetInput(String(updatedBudget.total_budget))
          setSaveFromDateInput(updatedBudget.from_date)
          setSaveToDateInput(updatedBudget.to_date)
          setAlertThresholdInput(String(toThresholdPercent(updatedBudget.alert_threshold)))
        }

        setSuccessMessage(result.message ?? '현재 활성 기간 예산을 수정했습니다.')
      } else {
        const result = await createBudgetPlan({
          total_budget: totalBudget,
          from_date: fromDate,
          to_date: toDate,
          alert_threshold: alertThreshold,
        })

        setSuccessMessage(result.message ?? '예산을 생성했습니다.')
        void navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const card = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const buttonClass =
    'inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
  const secondaryButton =
    'inline-flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted'

  return (
    <article aria-label="예산 설정 페이지" class="space-y-4">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">예산 설정</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            활성 기간 예산을 생성하거나 수정합니다.
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" class={secondaryButton} onClick={() => void navigate('/dashboard')}>
            대시보드로
          </button>
          <button type="button" class={secondaryButton} onClick={() => void navigate('/records')}>
            소비 기록 보기
          </button>
        </div>
      </header>

      <Show when={errorMessage()}>
        {(message) => (
          <div class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {message()}
          </div>
        )}
      </Show>

      <Show when={successMessage()}>
        {(message) => (
          <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message()}
          </div>
        )}
      </Show>

      <section class={card}>
        <div>
          <h2 class="text-lg font-semibold text-foreground">활성 기간 예산 저장</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            활성 기간 총예산과 알림 기준을 직접 저장합니다.
          </p>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <MoneyField
            label="총예산"
            value={saveTotalBudgetInput()}
            onInput={setSaveTotalBudgetInput}
            placeholder="예: 450000"
            description="총지출은 거래 원장에서 자동 계산됩니다."
          />
          <DateField
            label="시작일"
            value={saveFromDateInput()}
            onInput={setSaveFromDateInput}
            disabled={hasActiveBudget()}
          />
          <DateField
            label="종료일"
            value={saveToDateInput()}
            onInput={setSaveToDateInput}
            disabled={hasActiveBudget()}
          />
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <PercentField value={alertThresholdInput()} onInput={setAlertThresholdInput} />
          <div class="flex items-end">
            <button type="button" class={`${buttonClass} w-full md:w-auto`} disabled={saving()} onClick={() => void submitBudget()}>
              {saving() ? '저장 중...' : hasActiveBudget() ? '활성 예산 수정' : '예산 생성'}
            </button>
          </div>
        </div>

        <Show when={activeBudget()}>
          {(summary) => (
            <div class="mt-5 rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <p class="text-sm font-semibold text-foreground">현재 활성 예산</p>
              <p class="mt-2 text-sm text-muted-foreground">
                기간 {summary().from_date} ~ {summary().to_date}
              </p>
              <p class="mt-1 text-sm text-muted-foreground">
                총예산 {krwFormatter.format(summary().total_budget)} · 총지출 {krwFormatter.format(summary().total_spent)} · 잔여 {krwFormatter.format(summary().remaining_budget)}
              </p>
            </div>
          )}
        </Show>
      </section>
    </article>
  )
}
