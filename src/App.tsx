import { createMemo, createResource, createSignal } from 'solid-js'
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

const apiBaseUrl = (import.meta.env.VITE_CMS_API_BASE_URL ?? 'https://tyange.com/api/cms').replace(
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

function shiftWeekKey(weekKey: string, deltaWeeks: number): string {
  const matched = weekKey.match(/^(\d{4})-W(\d{2})$/)
  if (!matched) return weekKey

  const year = Number(matched[1])
  const week = Number(matched[2])

  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Weekday = (jan4.getUTCDay() + 6) % 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Weekday)

  const targetMonday = new Date(week1Monday)
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1 + deltaWeeks) * 7)

  const thursday = new Date(targetMonday)
  thursday.setUTCDate(targetMonday.getUTCDate() + 3)

  const isoYear = thursday.getUTCFullYear()
  const jan4OfIsoYear = new Date(Date.UTC(isoYear, 0, 4))
  const jan4IsoWeekday = (jan4OfIsoYear.getUTCDay() + 6) % 7
  const firstIsoMonday = new Date(jan4OfIsoYear)
  firstIsoMonday.setUTCDate(jan4OfIsoYear.getUTCDate() - jan4IsoWeekday)

  const diffDays = Math.round((targetMonday.getTime() - firstIsoMonday.getTime()) / 86400000)
  const isoWeek = Math.floor(diffDays / 7) + 1

  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`
}

function compareWeekKey(a: string, b: string): number {
  const parse = (value: string) => {
    const matched = value.match(/^(\d{4})-W(\d{2})$/)
    if (!matched) return null
    return { year: Number(matched[1]), week: Number(matched[2]) }
  }

  const left = parse(a)
  const right = parse(b)
  if (!left || !right) return 0
  if (left.year !== right.year) return left.year - right.year
  return left.week - right.week
}

type ApiError = Error & { status?: number }

async function fetchWeeklySummaryByWeekKey(weekKey: string): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly/${weekKey}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    const error = new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`) as ApiError
    error.status = response.status
    throw error
  }

  return response.json()
}

async function fetchWeeklySummaryByWeekKeySafe(weekKey: string): Promise<WeeklySummary | null> {
  try {
    return await fetchWeeklySummaryByWeekKey(weekKey)
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status === 404) return null
    throw error
  }
}

function App() {
  const [viewWeekKey, setViewWeekKey] = createSignal<string | null>(null)
  const [touchStartX, setTouchStartX] = createSignal<number | null>(null)
  const [anchorWeekKey, setAnchorWeekKey] = createSignal<string | null>(null)

  async function findNearestAvailableWeekKey(
    startWeekKey: string,
    direction: 1 | -1,
  ): Promise<string | null> {
    const maxScan = 52
    const batchSize = 6

    for (let base = 0; base < maxScan; base += batchSize) {
      const candidates = Array.from({ length: batchSize }, (_, index) => {
        const delta = base + index
        return shiftWeekKey(startWeekKey, direction * delta)
      })

      const results = await Promise.all(candidates.map((weekKey) => fetchWeeklySummaryByWeekKeySafe(weekKey)))
      const foundIndex = results.findIndex((result) => result !== null)
      if (foundIndex >= 0) {
        return candidates[foundIndex]
      }
    }

    return null
  }

  const [summary, { refetch }] = createResource(
    () => ({ targetWeekKey: viewWeekKey() }),
    async ({ targetWeekKey }) => {
      if (!targetWeekKey) {
        const current = await fetchWeeklySummary()
        setAnchorWeekKey(current.week_key)
        return current
      }

      if (!anchorWeekKey()) {
        setAnchorWeekKey(targetWeekKey)
      }
      return fetchWeeklySummaryByWeekKey(targetWeekKey)
    },
  )

  const [adjacentWeekKeys] = createResource(() => summary()?.week_key, async (currentWeekKey) => {
    if (!currentWeekKey) {
      return { prev: null as string | null, next: null as string | null }
    }

    const [prev, next] = await Promise.all([
      findNearestAvailableWeekKey(shiftWeekKey(currentWeekKey, -1), -1),
      findNearestAvailableWeekKey(shiftWeekKey(currentWeekKey, 1), 1),
    ])

    return { prev, next }
  })

  const sections = createMemo<FolderSection[]>(() => {
    const data = summary()
    if (!data) {
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

  const hasError = createMemo(() => Boolean(summary.error))
  const errorMessage = createMemo(() => summary.error?.message ?? '알 수 없는 오류')
  const canGoPrev = createMemo(() => Boolean(adjacentWeekKeys()?.prev) && !summary.loading && !adjacentWeekKeys.loading)
  const canGoNext = createMemo(() => Boolean(adjacentWeekKeys()?.next) && !summary.loading && !adjacentWeekKeys.loading)
  const usagePercent = createMemo(() => {
    const value = summary()?.usage_rate ?? 0
    return Math.max(0, Math.min(100, value * 100))
  })
  const weekTabLabel = createMemo(() => {
    const viewed = summary()?.week_key
    const anchor = anchorWeekKey()
    if (!viewed || !anchor) return '조회 중'
    const compare = compareWeekKey(viewed, anchor)
    if (compare === 0) return '이번 주'
    if (compare > 0) return `+${compare}주`
    return `${compare}주`
  })
  const disableFutureSpendMeta = createMemo(() => {
    const data = summary()
    const anchor = anchorWeekKey()
    if (!data || !anchor) return false
    return compareWeekKey(data.week_key, anchor) > 0 && data.total_spent === 0 && data.record_count === 0
  })

  const moveWeek = (deltaWeeks: number) => {
    if (deltaWeeks < 0) {
      const prevWeekKey = adjacentWeekKeys()?.prev
      if (!prevWeekKey) return
      setViewWeekKey(prevWeekKey)
      return
    }

    const nextWeekKey = adjacentWeekKeys()?.next
    if (!nextWeekKey) return
    setViewWeekKey(nextWeekKey)
  }

  return (
    <div class="flex min-h-screen flex-col bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.6),transparent_30%),linear-gradient(180deg,#f5f5f5_0%,#e7e7e7_100%)] text-slate-900">
      <main class="flex flex-1 items-center justify-center p-6 max-[820px]:p-4">
        <section aria-label="Dashboard" class="w-full max-w-[920px]">
          {hasError() && (
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
                  if (diff <= -40 && canGoNext()) moveWeek(1)
                  if (diff >= 40 && canGoPrev()) moveWeek(-1)
                  setTouchStartX(null)
                }}
              >
                {section.isLoading ? (
                  <div class="animate-pulse">
                    <div class="h-3 w-24 rounded bg-slate-300/70" />
                    <div class="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4">
                      <div class="h-3 w-20 rounded bg-slate-200" />
                      <div class="mt-3 h-10 w-52 rounded bg-slate-300/70" />
                      <div class="mt-4 h-2 w-full rounded bg-slate-200" />
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <div class="h-3 w-14 rounded bg-slate-200" />
                        <div class="mt-2 h-6 w-20 rounded bg-slate-300/70" />
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <div class="h-3 w-14 rounded bg-slate-200" />
                        <div class="mt-2 h-6 w-24 rounded bg-slate-300/70" />
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <div class="h-3 w-16 rounded bg-slate-200" />
                        <div class="mt-2 h-6 w-28 rounded bg-slate-300/70" />
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <div class="h-3 w-16 rounded bg-slate-200" />
                        <div class="mt-2 h-6 w-24 rounded bg-slate-300/70" />
                      </div>
                    </div>
                  </div>
                ) : section.isDummy ? (
                  <div class="flex min-h-[inherit] items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/40">
                    <p class="m-0 text-lg font-semibold tracking-wide text-slate-500/90">Coming Soon</p>
                  </div>
                ) : section.id === 'weekly-budget' && summary() ? (
                  <>
                    <div class="flex items-center justify-between">
                      <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
                      <div class="flex items-center gap-1.5">
                        <button
                          type="button"
                          class={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                            canGoPrev()
                              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                          disabled={!canGoPrev()}
                          onClick={() => moveWeek(-1)}
                        >
                          이전 주
                        </button>
                        <button
                          type="button"
                          class={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                            canGoNext()
                              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                          disabled={!canGoNext()}
                          onClick={() => moveWeek(1)}
                        >
                          다음 주
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                          onClick={() => setViewWeekKey(null)}
                        >
                          이번 주
                        </button>
                        <button
                          type="button"
                          class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                          onClick={() => refetch()}
                        >
                          새로고침
                        </button>
                        <span class="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {summary.loading ? '조회중...' : weekTabLabel()}
                        </span>
                      </div>
                    </div>
                    <div class="mt-4 rounded-xl border border-slate-200 bg-white/90 p-4">
                      <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">남은 예산</p>
                      <p class="mt-2 mb-0 text-4xl leading-none font-bold tracking-tight tabular-nums text-slate-900">
                        {krwFormatter.format(summary()!.remaining)}
                      </p>
                      <div class="mt-4">
                        <div class="mb-2 flex items-center justify-between text-xs text-slate-500">
                          <span>사용률</span>
                          <span class="tabular-nums">{usagePercent().toFixed(1)}%</span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            class={`h-full rounded-full ${summary()!.alert ? 'bg-rose-500' : 'bg-slate-700'}`}
                            style={{ width: `${usagePercent()}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주차</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">{summary()!.week_key}</p>
                      </div>
                      <div
                        class={`rounded-lg border border-slate-200 bg-white/80 p-3 ${disableFutureSpendMeta() ? 'opacity-40 grayscale' : ''}`}
                        aria-disabled={disableFutureSpendMeta()}
                      >
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">기록 수</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {disableFutureSpendMeta() ? '-' : `${summary()!.record_count}건`}
                        </p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주간 한도</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {krwFormatter.format(summary()!.weekly_limit)}
                        </p>
                      </div>
                      <div
                        class={`rounded-lg border border-slate-200 bg-white/80 p-3 ${disableFutureSpendMeta() ? 'opacity-40 grayscale' : ''}`}
                        aria-disabled={disableFutureSpendMeta()}
                      >
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">총 지출</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {disableFutureSpendMeta() ? '-' : krwFormatter.format(summary()!.total_spent)}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium">
                      알림: {summary()!.alert ? 'ON' : 'OFF'}
                    </div>
                    <p class="mt-2 mb-0 text-[11px] text-slate-400">카드를 좌우로 스와이프해서 주차 전환</p>
                  </>
                ) : (
                  <>
                    <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
                    <div class="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white/80">
                      {section.rows.map((row) => (
                        <div class="flex items-center justify-between px-3 py-3">
                          <span class="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</span>
                          <span class="text-2xl font-bold leading-none tracking-tight tabular-nums text-slate-900">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
