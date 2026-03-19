import { useNavigate } from '@solidjs/router'
import { Show, createSignal, onCleanup, onMount } from 'solid-js'
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
    return '로그인이 만료됐어요. 다시 로그인해 주세요.'
  }

  if (status === 404) {
    return '예산이 없거나 수정할 예산을 찾을 수 없어요.'
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
    <label class="block">
      <span class="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{props.label}</span>
      <input
        type="text"
        inputmode="numeric"
        autocomplete="off"
        value={props.value}
        disabled={props.disabled}
        onInput={(event) => props.onInput(digitsOnly(event.currentTarget.value))}
        class="w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/55 disabled:cursor-not-allowed disabled:opacity-70"
        placeholder={props.placeholder}
      />
      <Show when={props.description}>
        {(description) => <p class="mt-2 text-xs leading-5 text-muted-foreground">{description()}</p>}
      </Show>
    </label>
  )
}

type PercentFieldProps = {
  value: string
  onInput: (value: string) => void
}

function PercentField(props: PercentFieldProps) {
  return (
    <label class="block">
      <span class="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">알림 기준 (%)</span>
      <input
        type="number"
        min="0"
        max="100"
        step="1"
        inputmode="numeric"
        value={props.value}
        onInput={(event) => props.onInput(event.currentTarget.value)}
        class="w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/55"
        placeholder="예: 85"
      />
      <p class="mt-2 text-xs leading-5 text-muted-foreground">사용률이 이 값을 넘기면 경고 상태로 표시됩니다.</p>
    </label>
  )
}

type DateFieldProps = {
  label: string
  value: string
  onInput: (value: string) => void
  disabled?: boolean
}

function DateField(props: DateFieldProps) {
  const [open, setOpen] = createSignal(false)
  let containerRef: HTMLDivElement | undefined
  const inputClass =
    'w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 pr-14 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/55 disabled:cursor-not-allowed disabled:opacity-70'

  const closePopover = () => setOpen(false)

  onMount(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!open() || !containerRef) return
      if (event.target instanceof Node && !containerRef.contains(event.target)) {
        closePopover()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopover()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    onCleanup(() => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    })
  })

  return (
    <div class="block">
      <label class="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{props.label}</label>
      <div class="relative" ref={containerRef}>
        <input
          aria-label={props.label}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          value={props.value}
          disabled={props.disabled}
          onInput={(event) => props.onInput(dateInputOnly(event.currentTarget.value))}
          class={inputClass}
          placeholder="YYYY-MM-DD"
        />
        <button
          type="button"
          class="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-border/70 bg-card/82 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          aria-label={`${props.label} 달력 열기`}
          aria-expanded={open()}
          disabled={props.disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarIcon />
        </button>
        <Show when={open()}>
          <div class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border/70 bg-card p-4 text-foreground shadow-[0_18px_40px_color-mix(in_srgb,var(--shadow-color)_18%,transparent)]">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-semibold tracking-[0.01em] text-foreground">{props.label}</p>
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => {
                  props.onInput(formatDateInput(new Date()))
                  closePopover()
                }}
                disabled={props.disabled}
              >
                오늘
              </button>
            </div>
            <input
              type="date"
              value={props.value}
              disabled={props.disabled}
              onInput={(event) => {
                props.onInput(event.currentTarget.value)
                closePopover()
              }}
              class="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-70"
            />
            <p class="mt-2 text-xs leading-5 text-muted-foreground">직접 입력하거나 달력에서 날짜를 선택할 수 있습니다.</p>
          </div>
        </Show>
      </div>
    </div>
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
      setErrorMessage('총예산을 1원 이상 입력해 주세요.')
      setSuccessMessage(null)
      return
    }

    if (!Number.isFinite(alertThresholdPercent) || alertThresholdPercent < 0 || alertThresholdPercent > 100) {
      setErrorMessage('알림 기준은 0~100% 사이로 입력해 주세요.')
      setSuccessMessage(null)
      return
    }

    if (!hasActiveBudget() && (!fromDate || !toDate)) {
      setErrorMessage('시작일과 종료일을 모두 입력해 주세요.')
      setSuccessMessage(null)
      return
    }

    if (!hasActiveBudget() && fromDate > toDate) {
      setErrorMessage('시작일이 종료일보다 늦어요.')
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

        setSuccessMessage(result.message ?? '예산을 수정했어요.')
      } else {
        const result = await createBudgetPlan({
          total_budget: totalBudget,
          from_date: fromDate,
          to_date: toDate,
          alert_threshold: alertThreshold,
        })

        setSuccessMessage(result.message ?? '예산을 만들었어요.')
        void navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60'
  const section = 'pt-8'
  const statCell = 'rounded-2xl border border-border/70 bg-background/78 px-4 py-4'

  return (
    <article aria-label="예산 설정 페이지" class="space-y-8 pb-10">
      <header>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Budget Setup</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">예산 설정</h1>
        </div>
      </header>

      <Show when={errorMessage()}>
        {(message) => (
          <div class="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {message()}
          </div>
        )}
      </Show>

      <Show when={successMessage()}>
        {(message) => (
          <div class="rounded-2xl border border-emerald-500/24 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
            {message()}
          </div>
        )}
      </Show>

      <Show when={activeBudget()}>
        {(summary) => (
          <section class="border-b border-border/70 py-5">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">현재 적용 기간</p>
                <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {summary().from_date} ~ {summary().to_date}
                </p>
              </div>
              <div class="grid gap-3 sm:grid-cols-3">
                <div class={statCell}>
                  <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">총예산</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(summary().total_budget)}</p>
                </div>
                <div class={statCell}>
                  <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">총지출</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(summary().total_spent)}</p>
                </div>
                <div class={statCell}>
                  <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">잔여</p>
                  <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(summary().remaining_budget)}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </Show>

      <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section class={section}>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Budget Form</p>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {hasActiveBudget() ? '현재 예산 수정' : '새 예산 생성'}
          </h2>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <MoneyField
              label="총예산"
              value={saveTotalBudgetInput()}
              onInput={setSaveTotalBudgetInput}
              placeholder="예: 450000"
              description="소비 기록 기반으로 자동 계산돼요."
            />
            <PercentField value={alertThresholdInput()} onInput={setAlertThresholdInput} />
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

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" class={primaryButton} disabled={saving()} onClick={() => void submitBudget()}>
              {saving() ? '저장 중...' : hasActiveBudget() ? '현재 예산 수정' : '예산 생성'}
            </button>
            <span class="text-sm text-muted-foreground">
              {hasActiveBudget() ? '적용 기간은 고정되며 총예산과 알림 기준만 수정합니다.' : '처음 생성할 때만 시작일과 종료일을 입력합니다.'}
            </span>
          </div>
        </section>

        <aside class={section}>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Summary</p>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">입력 요약</h2>
          <div class="mt-5 space-y-3">
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">입력 총예산</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">
                {saveTotalBudgetInput() ? krwFormatter.format(Number(saveTotalBudgetInput())) : '-'}
              </p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">알림 기준</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">{alertThresholdInput() || '0'}%</p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">기간</p>
              <p class="mt-2 text-lg font-semibold text-foreground">
                {saveFromDateInput() || '-'} ~ {saveToDateInput() || '-'}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </article>
  )
}
