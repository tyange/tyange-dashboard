import { createMemo, createSignal, onMount } from 'solid-js'
import { Button } from '@kobalte/core/button'
import { Skeleton } from '@kobalte/core/skeleton'
import { compareAsc, differenceInCalendarWeeks, isValid, parse } from 'date-fns'
import PWABadge from './PWABadge'

type CardSize = 'sm' | 'md' | 'lg'
type CardTone = 'sky' | 'mint' | 'slate' | 'rose'

type WeeklySummary = {
  week_key: string
  weekly_limit: number
  total_spent: number
  remaining: number
  usage_rate: number
  alert: boolean
  record_count: number
}

type BudgetWeeksResponse = {
  weeks: string[]
  min_week?: string | null
  max_week?: string | null
}

type SectionRow = {
  label: string
  value: string
}

type FolderSection = {
  id: string
  title: string
  size: CardSize
  tone: CardTone
  isDummy?: boolean
  isLoading?: boolean
  rows: SectionRow[]
}

const apiBaseUrl = (import.meta.env.VITE_CMS_API_BASE_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)

const sizeClassByKey = {
  sm: 'min-h-48',
  md: 'min-h-64',
  lg: 'min-h-80',
} as const

const toneClassByKey = {
  sky: 'bg-slate-50/95',
  mint: 'bg-zinc-50/95',
  slate: 'bg-white/95',
  rose: 'bg-neutral-100/95',
} as const

const krwFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

async function fetchWeeklySummary(): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`)
  }

  return response.json()
}

async function fetchWeeklySummaryByWeekKey(weekKey: string): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly/${weekKey}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`)
  }

  return response.json()
}

async function fetchBudgetWeeks(): Promise<BudgetWeeksResponse> {
  const response = await fetch(`${apiBaseUrl}/budget/weeks`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주차 목록 조회 실패'}`)
  }

  return response.json()
}

function compareWeekKey(a: string, b: string): number {
  const left = weekKeyToDate(a)
  const right = weekKeyToDate(b)
  if (!left || !right) return 0
  return compareAsc(left, right)
}

function weekKeyToDate(weekKey: string): Date | null {
  const parsed = parse(`${weekKey}-1`, "RRRR-'W'II-i", new Date())
  if (!isValid(parsed)) return null
  return parsed
}

function App() {
  const [summaryByWeek, setSummaryByWeek] = createSignal<Record<string, WeeklySummary>>({})
  const [knownWeekKeys, setKnownWeekKeys] = createSignal<string[]>([])
  const [currentWeekKey, setCurrentWeekKey] = createSignal<string | null>(null)
  const [anchorWeekKey, setAnchorWeekKey] = createSignal<string | null>(null)
  const [touchStartX, setTouchStartX] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

  const normalizeWeekKeys = (weeks: string[], currentWeekKey?: string) => {
    const unique = new Set(weeks)
    if (currentWeekKey) unique.add(currentWeekKey)
    return [...unique].sort(compareWeekKey)
  }

  const registerWeekSummary = (data: WeeklySummary) => {
    setSummaryByWeek((prev) => ({ ...prev, [data.week_key]: data }))
    setCurrentWeekKey(data.week_key)
  }

  const loadCurrentWeek = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [weeksResult, data] = await Promise.all([fetchBudgetWeeks(), fetchWeeklySummary()])
      setAnchorWeekKey(data.week_key)
      setKnownWeekKeys(normalizeWeekKeys(weeksResult.weeks ?? [], data.week_key))
      registerWeekSummary(data)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    void loadCurrentWeek()
  })

  const currentSummary = createMemo(() => {
    const key = currentWeekKey()
    if (!key) return null
    return summaryByWeek()[key] ?? null
  })

  const currentWeekIndex = createMemo(() => {
    const key = currentWeekKey()
    if (!key) return -1
    return knownWeekKeys().indexOf(key)
  })

  const canGoPrev = createMemo(() => !loading() && currentWeekIndex() > 0)
  const canGoNext = createMemo(() => !loading() && currentWeekIndex() >= 0 && currentWeekIndex() < knownWeekKeys().length - 1)

  const moveKnownWeek = (direction: 1 | -1) => {
    const idx = currentWeekIndex()
    if (idx < 0) return
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= knownWeekKeys().length) return
    const targetWeekKey = knownWeekKeys()[nextIdx]
    const cached = summaryByWeek()[targetWeekKey]
    if (cached) {
      setCurrentWeekKey(targetWeekKey)
      return
    }

    setLoading(true)
    setErrorMessage(null)
    void fetchWeeklySummaryByWeekKey(targetWeekKey)
      .then((data) => {
        setSummaryByWeek((prev) => ({ ...prev, [data.week_key]: data }))
        setCurrentWeekKey(data.week_key)
      })
      .catch((error) => {
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const usagePercent = createMemo(() => {
    const value = currentSummary()?.usage_rate ?? 0
    return Math.max(0, Math.min(100, value * 100))
  })

  const weekTabLabel = createMemo(() => {
    const viewed = currentSummary()?.week_key
    const anchor = anchorWeekKey()
    if (!viewed || !anchor) return '조회 중'
    const viewedDate = weekKeyToDate(viewed)
    const anchorDate = weekKeyToDate(anchor)
    if (!viewedDate || !anchorDate) return '조회 중'
    const diffWeeks = differenceInCalendarWeeks(viewedDate, anchorDate, { weekStartsOn: 1 })
    if (diffWeeks === 0) return '이번 주'
    if (diffWeeks > 0) return `+${diffWeeks}주`
    return `${diffWeeks}주`
  })

  const disableFutureSpendMeta = createMemo(() => {
    const data = currentSummary()
    const anchor = anchorWeekKey()
    if (!data || !anchor) return false
    return compareWeekKey(data.week_key, anchor) > 0 && data.total_spent === 0 && data.record_count === 0
  })

  const sections = createMemo<FolderSection[]>(() => {
    const data = currentSummary()
    if (!data || loading()) {
      return [
        {
          id: 'loading-weekly-budget',
          title: 'Weekly Budget',
          size: 'lg',
          tone: 'slate',
          isLoading: true,
          rows: [
            { label: 'Week', value: 'Loading...' },
            { label: 'Weekly Limit', value: 'Loading...' },
            { label: 'Total Spent', value: 'Loading...' },
            { label: 'Remaining', value: 'Loading...' },
          ],
        },
        {
          id: 'loading-dummy-1',
          title: 'Dummy Section',
          size: 'sm',
          tone: 'sky',
          isDummy: true,
          rows: [{ label: 'Status', value: 'Loading...' }],
        },
      ]
    }

    return [
      {
        id: 'weekly-budget',
        title: '주간 예산',
        size: 'lg',
        tone: 'slate',
        rows: [
          { label: '주차', value: data.week_key },
          { label: '주간 한도', value: krwFormatter.format(data.weekly_limit) },
          { label: '총 지출', value: krwFormatter.format(data.total_spent) },
          { label: '남은 예산', value: krwFormatter.format(data.remaining) },
          { label: '사용률', value: `${(data.usage_rate * 100).toFixed(1)}%` },
          { label: '알림', value: data.alert ? 'ON' : 'OFF' },
          { label: '기록 수', value: `${data.record_count}건` },
        ],
      },
      {
        id: 'dummy-trend',
        title: 'Dummy Trend',
        size: 'sm',
        tone: 'mint',
        isDummy: true,
        rows: [
          { label: 'Today', value: '+2.3%' },
          { label: '7 Days', value: '+5.9%' },
        ],
      },
      {
        id: 'dummy-service',
        title: 'Dummy Service',
        size: 'md',
        tone: 'sky',
        isDummy: true,
        rows: [
          { label: 'Latency', value: '92ms' },
          { label: 'Error Rate', value: '0.21%' },
          { label: 'Availability', value: '99.9%' },
        ],
      },
      {
        id: 'dummy-channel',
        title: 'Dummy Channel',
        size: 'sm',
        tone: 'rose',
        isDummy: true,
        rows: [
          { label: 'Organic', value: '41%' },
          { label: 'Direct', value: '35%' },
        ],
      },
    ]
  })

  return (
    <div class="flex min-h-screen flex-col bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.6),transparent_30%),linear-gradient(180deg,#f5f5f5_0%,#e7e7e7_100%)] text-slate-900">
      <main class="flex flex-1 items-center justify-center p-6 max-[820px]:p-4">
        <section aria-label="Dashboard" class="w-full max-w-[920px]">
          {errorMessage() && (
            <div class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage()}
            </div>
          )}

          <section aria-label="Dashboard sections" class="columns-1 gap-4 md:columns-2">
            {sections().map((section) => (
              <article
                id={section.id}
                class={`mb-4 break-inside-avoid rounded-2xl border border-slate-300/70 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${sizeClassByKey[section.size]} ${toneClassByKey[section.tone]}`}
                onTouchStart={(event) => {
                  if (section.id === 'weekly-budget') {
                    setTouchStartX(event.touches[0]?.clientX ?? null)
                  }
                }}
                onTouchEnd={(event) => {
                  if (section.id !== 'weekly-budget') return
                  const startX = touchStartX()
                  const endX = event.changedTouches[0]?.clientX
                  if (startX == null || endX == null) return
                  const diff = endX - startX
                  if (diff <= -40 && canGoNext()) moveKnownWeek(1)
                  if (diff >= 40 && canGoPrev()) moveKnownWeek(-1)
                  setTouchStartX(null)
                }}
              >
                {section.isLoading ? (
                  <div class="animate-pulse">
                    <Skeleton class="h-3 w-24 rounded bg-slate-300/70" />
                    <div class="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4">
                      <Skeleton class="h-3 w-20 rounded bg-slate-200" />
                      <Skeleton class="mt-3 h-10 w-52 rounded bg-slate-300/70" />
                      <Skeleton class="mt-4 h-2 w-full rounded bg-slate-200" />
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <Skeleton class="h-3 w-14 rounded bg-slate-200" />
                        <Skeleton class="mt-2 h-6 w-20 rounded bg-slate-300/70" />
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <Skeleton class="h-3 w-14 rounded bg-slate-200" />
                        <Skeleton class="mt-2 h-6 w-24 rounded bg-slate-300/70" />
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <Skeleton class="h-3 w-16 rounded bg-slate-200" />
                        <Skeleton class="mt-2 h-6 w-28 rounded bg-slate-300/70" />
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <Skeleton class="h-3 w-16 rounded bg-slate-200" />
                        <Skeleton class="mt-2 h-6 w-24 rounded bg-slate-300/70" />
                      </div>
                    </div>
                  </div>
                ) : section.isDummy ? (
                  <div class="flex min-h-[inherit] items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/40">
                    <p class="m-0 text-lg font-semibold tracking-wide text-slate-500/90">Coming Soon</p>
                  </div>
                ) : section.id === 'weekly-budget' && currentSummary() ? (
                  <>
                    <div class="flex items-center justify-between">
                      <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
                      <div class="flex items-center gap-1.5">
                        <Button
                          class={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                            canGoPrev()
                              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                          disabled={!canGoPrev()}
                          onClick={() => moveKnownWeek(-1)}
                        >
                          이전 주
                        </Button>
                        <Button
                          class={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                            canGoNext()
                              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                          disabled={!canGoNext()}
                          onClick={() => moveKnownWeek(1)}
                        >
                          다음 주
                        </Button>
                        <Button
                          class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                          onClick={() => void loadCurrentWeek()}
                        >
                          이번 주
                        </Button>
                        <Button
                          class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                          onClick={() => void loadCurrentWeek()}
                        >
                          새로고침
                        </Button>
                        <span class="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {loading() ? '조회중...' : weekTabLabel()}
                        </span>
                      </div>
                    </div>
                    <div class="mt-4 rounded-xl border border-slate-200 bg-white/90 p-4">
                      <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">남은 예산</p>
                      <p class="mt-2 mb-0 text-4xl leading-none font-bold tracking-tight tabular-nums text-slate-900">
                        {krwFormatter.format(currentSummary()!.remaining)}
                      </p>
                      <div class="mt-4">
                        <div class="mb-2 flex items-center justify-between text-xs text-slate-500">
                          <span>사용률</span>
                          <span class="tabular-nums">{usagePercent().toFixed(1)}%</span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            class={`h-full rounded-full ${currentSummary()!.alert ? 'bg-rose-500' : 'bg-slate-700'}`}
                            style={{ width: `${usagePercent()}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주차</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">{currentSummary()!.week_key}</p>
                      </div>
                      <div
                        class={`rounded-lg border border-slate-200 bg-white/80 p-3 ${disableFutureSpendMeta() ? 'opacity-40 grayscale' : ''}`}
                        aria-disabled={disableFutureSpendMeta()}
                      >
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">기록 수</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {disableFutureSpendMeta() ? '-' : `${currentSummary()!.record_count}건`}
                        </p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주간 한도</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {krwFormatter.format(currentSummary()!.weekly_limit)}
                        </p>
                      </div>
                      <div
                        class={`rounded-lg border border-slate-200 bg-white/80 p-3 ${disableFutureSpendMeta() ? 'opacity-40 grayscale' : ''}`}
                        aria-disabled={disableFutureSpendMeta()}
                      >
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">총 지출</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {disableFutureSpendMeta() ? '-' : krwFormatter.format(currentSummary()!.total_spent)}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium">
                      알림: {currentSummary()!.alert ? 'ON' : 'OFF'}
                    </div>
                    <p class="mt-2 mb-0 text-[11px] text-slate-400">카드를 좌우로 스와이프해서 주차 전환</p>
                  </>
                ) : null}
              </article>
            ))}
          </section>
        </section>
      </main>

      <footer class="flex h-12 items-center justify-center text-[13px] text-slate-500">
        <p class="m-0">© 2026 Your Company</p>
      </footer>

      <PWABadge />
    </div>
  )
}

export default App
