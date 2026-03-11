import { Popover } from '@kobalte/core/popover'
import { TextField } from '@kobalte/core/text-field'
import { useNavigate } from '@solidjs/router'
import { For, Show, createSignal, onMount } from 'solid-js'
import {
  calculateRemainingWeeklyBudget,
  createBudgetPlan,
  fetchBudgetSummary,
  updateBudget,
} from '../api'
import { getApiErrorStatus, isBudgetNotConfiguredError } from '../errors'
import { krwFormatter } from '../format'
import type { BudgetSummary, RemainingWeeklyBudgetResponse } from '../types'
import { formatDateInput, pickRecommendedWeeklyLimit } from '../utils'

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

function formatBucketLabel(fromDate: string, toDate: string, days: number) {
  return `${fromDate} ~ ${toDate} (${days}일)`
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

function getCalculatorErrorMessage(error: unknown) {
  const status = getApiErrorStatus(error)

  if (status === 401) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 400) {
    return `잘못된 파일이거나 날짜/예산 입력이 올바르지 않습니다. ${(error as Error).message.slice('API 400: '.length)}`
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
  const [saveTotalSpentInput, setSaveTotalSpentInput] = createSignal('')
  const [saveFromDateInput, setSaveFromDateInput] = createSignal('')
  const [saveToDateInput, setSaveToDateInput] = createSignal('')
  const [alertThresholdInput, setAlertThresholdInput] = createSignal('85')
  const [calcTotalBudgetInput, setCalcTotalBudgetInput] = createSignal('')
  const [calcFromDateInput, setCalcFromDateInput] = createSignal('')
  const [calcToDateInput, setCalcToDateInput] = createSignal('')
  const [calcAsOfDateInput, setCalcAsOfDateInput] = createSignal(formatDateInput(new Date()))
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null)
  const [calculatorResult, setCalculatorResult] = createSignal<RemainingWeeklyBudgetResponse | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [calculating, setCalculating] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  onMount(() => {
    void fetchBudgetSummary()
      .then((summary) => {
        setHasActiveBudget(true)
        setActiveBudget(summary)
        setSaveTotalBudgetInput(String(summary.total_budget))
        setSaveTotalSpentInput(String(summary.total_spent))
        setSaveFromDateInput(summary.from_date)
        setSaveToDateInput(summary.to_date)
        setAlertThresholdInput(String(toThresholdPercent(summary.alert_threshold)))
        setCalcTotalBudgetInput(String(summary.total_budget))
        setCalcFromDateInput(summary.from_date)
        setCalcToDateInput(summary.to_date)
      })
      .catch((error) => {
        if (isBudgetNotConfiguredError(error)) {
          setHasActiveBudget(false)
          return
        }

        setErrorMessage(getSaveErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const submitCalculator = async () => {
    const file = selectedFile()
    const totalBudget = Number(calcTotalBudgetInput())
    const fromDate = calcFromDateInput().trim()
    const toDate = calcToDateInput().trim()
    const asOfDate = calcAsOfDateInput().trim()

    if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
      setErrorMessage('총 예산은 0보다 큰 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (!fromDate || !toDate) {
      setErrorMessage('시작일과 종료일을 모두 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (fromDate > toDate) {
      setErrorMessage('시작일은 종료일보다 늦을 수 없습니다.')
      setSuccessMessage(null)
      return
    }

    if (!file) {
      setErrorMessage('카드 엑셀 파일을 먼저 선택해주세요.')
      setSuccessMessage(null)
      return
    }

    setCalculating(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const result = await calculateRemainingWeeklyBudget(file, {
        totalBudget,
        fromDate,
        toDate,
        asOfDate: asOfDate || undefined,
      })
      const recommendedBudget = pickRecommendedWeeklyLimit(result)

      setCalculatorResult(result)
      setSaveTotalBudgetInput(String(recommendedBudget))
      setSaveFromDateInput(fromDate)
      setSaveToDateInput(toDate)
      setSuccessMessage('계산 결과를 불러왔습니다. 추천 금액을 검토한 뒤 아래 단계에서 활성 기간 예산으로 직접 저장해주세요.')
    } catch (error) {
      setCalculatorResult(null)
      setErrorMessage(getCalculatorErrorMessage(error))
    } finally {
      setCalculating(false)
    }
  }

  const submitBudget = async () => {
    if (saving()) return

    const totalBudget = Number(saveTotalBudgetInput())
    const totalSpentValue = saveTotalSpentInput().trim()
    const totalSpent = totalSpentValue === '' ? undefined : Number(totalSpentValue)
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
          setSaveTotalBudgetInput(String(updatedBudget.total_budget))
          setSaveTotalSpentInput(String(updatedBudget.total_spent))
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
          total_spent: totalSpent,
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
            활성 기간 예산을 생성하거나 수정하고, 카드 엑셀 계산 결과를 검토한 뒤 명시적으로 저장할 수 있습니다.
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
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Step 1</p>
            <h2 class="mt-2 text-lg font-semibold text-foreground">엑셀 업로드 후 계산</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              카드 사용 내역 파일을 기준으로 남은 예산과 주간 버킷 추천 금액을 계산합니다.
            </p>
          </div>
          <Show when={!loading()} fallback={<span class="text-xs text-muted-foreground">불러오는 중...</span>}>
            <span class="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
              {hasActiveBudget() ? '활성 예산 기준' : '새 기간 기준'}
            </span>
          </Show>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <MoneyField
            label="총 예산"
            value={calcTotalBudgetInput()}
            onInput={setCalcTotalBudgetInput}
            placeholder="예: 2400000"
          />
          <DateField label="기준일 (선택)" value={calcAsOfDateInput()} onInput={setCalcAsOfDateInput} />
          <DateField label="시작일" value={calcFromDateInput()} onInput={setCalcFromDateInput} />
          <DateField label="종료일" value={calcToDateInput()} onInput={setCalcToDateInput} />
          <label class="block md:col-span-2">
            <span class="mb-2 block text-sm font-medium text-foreground">카드 사용 엑셀 파일</span>
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              class="block w-full rounded-2xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-primary-foreground"
              onChange={(event) => setSelectedFile(event.currentTarget.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Show when={selectedFile()}>
            {(file) => <p class="text-xs text-muted-foreground">선택 파일: {file().name}</p>}
          </Show>
          <button type="button" class={buttonClass} disabled={calculating()} onClick={() => void submitCalculator()}>
            {calculating() ? '계산 중...' : '엑셀 업로드 후 계산'}
          </button>
        </div>
      </section>

      <section class={card}>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Step 2</p>
          <h2 class="mt-2 text-lg font-semibold text-foreground">추천 버킷 검토</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            계산 결과는 미리보기입니다. 추천 금액을 확인한 뒤 아래 단계에서 활성 기간 예산으로 직접 저장해야 반영됩니다.
          </p>
        </div>

        <Show when={calculatorResult()} fallback={<p class="mt-5 text-sm text-muted-foreground">아직 계산 결과가 없습니다. 먼저 엑셀 업로드 후 계산을 진행해주세요.</p>}>
          {(result) => (
            <div class="mt-5 space-y-4">
              <div class="grid gap-3 md:grid-cols-4">
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">총 예산</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{krwFormatter.format(result().total_budget)}</p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">현재까지 순지출</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{krwFormatter.format(result().spent_net)}</p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">남은 예산</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{krwFormatter.format(result().remaining_budget)}</p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">남은 일수</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{result().remaining_days}일</p>
                </article>
              </div>

              <p class="text-sm text-muted-foreground">
                기간 {result().period_start} ~ {result().period_end} · 기준일 {result().as_of_date}
              </p>

              <Show when={result().is_overspent}>
                <div class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  남은 예산이 음수입니다. 버킷 추천 금액은 0원 또는 매우 낮게 계산될 수 있습니다.
                </div>
              </Show>

              <div class="space-y-3">
                <For each={result().buckets}>
                  {(bucket) => {
                    const isRecommended = bucket.amount === pickRecommendedWeeklyLimit(result())

                    return (
                      <article class={`rounded-2xl border p-4 ${isRecommended ? 'border-primary/40 bg-primary/8' : 'border-border/80 bg-secondary/20'}`}>
                        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p class="text-sm font-semibold text-foreground">
                              버킷 {bucket.bucket_index}
                            </p>
                            <p class="mt-1 text-xs text-muted-foreground">{formatBucketLabel(bucket.from_date, bucket.to_date, bucket.days)}</p>
                          </div>
                          <div class="text-right">
                            <p class="text-lg font-semibold text-foreground">{krwFormatter.format(bucket.amount)}</p>
                            <Show when={isRecommended}>
                              <p class="text-xs text-primary">추천 저장값으로 반영됨</p>
                            </Show>
                          </div>
                        </div>
                      </article>
                    )
                  }}
                </For>
              </div>
            </div>
          )}
        </Show>
      </section>

      <section class={card}>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Step 3</p>
          <h2 class="mt-2 text-lg font-semibold text-foreground">활성 기간 예산 명시적으로 저장</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            계산 결과는 자동 저장되지 않습니다. 아래 활성 기간 예산 저장을 눌러야 실제 예산에 반영됩니다.
          </p>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <MoneyField
            label="총예산"
            value={saveTotalBudgetInput()}
            onInput={setSaveTotalBudgetInput}
            placeholder="예: 450000"
            description="엑셀 계산 후에는 추천 버킷 금액이 기본값으로 채워집니다."
          />
          <MoneyField
            label="현재까지 지출 총액 (선택)"
            value={saveTotalSpentInput()}
            onInput={setSaveTotalSpentInput}
            placeholder="예: 120000"
            description="입력하면 snapshot total_spent로 저장됩니다."
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
