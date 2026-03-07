import { Show, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { getYear } from 'date-fns'
import PWABadge from './PWABadge'
import {
  fetchBudgetWeeks,
  fetchWeeklySpendRecords,
  fetchWeeklySummary,
  fetchWeeklySummaryByWeekKey,
} from './features/budget/api'
import SpendRecordsPage from './features/budget/components/SpendRecordsPage'
import WeeklyBudgetCard from './features/budget/components/WeeklyBudgetCard'
import type { WeeklySpendRecord, WeeklySummary } from './features/budget/types'
import { compareWeekKey, getWeekTabLabel } from './features/budget/weekKey'

const emptySummary: WeeklySummary = {
  week_key: '-',
  weekly_limit: 0,
  total_spent: 0,
  remaining: 0,
  usage_rate: 0,
  alert: false,
  record_count: 0,
}

function App() {
  const currentYear = getYear(new Date())
  const [activePage, setActivePage] = createSignal<'dashboard' | 'records'>('dashboard')
  const [summaryByWeek, setSummaryByWeek] = createSignal<Record<string, WeeklySummary>>({})
  const [knownWeekKeys, setKnownWeekKeys] = createSignal<string[]>([])
  const [currentWeekKey, setCurrentWeekKey] = createSignal<string | null>(null)
  const [anchorWeekKey, setAnchorWeekKey] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [isScrolled, setIsScrolled] = createSignal(false)
  const [recordsByWeek, setRecordsByWeek] = createSignal<Partial<Record<string, WeeklySpendRecord[]>>>({})
  const [recordsLoadingByWeek, setRecordsLoadingByWeek] = createSignal<Partial<Record<string, boolean>>>({})
  const [recordsErrorByWeek, setRecordsErrorByWeek] = createSignal<Partial<Record<string, string | null>>>({})

  const buildKnownWeekKeys = (weeks: string[], currentKey?: string) => {
    const unique = new Set(weeks)
    if (currentKey) unique.add(currentKey)
    return [...unique].sort(compareWeekKey)
  }

  const cacheWeekSummary = (data: WeeklySummary) => {
    setSummaryByWeek((prev) => ({ ...prev, [data.week_key]: data }))
    setCurrentWeekKey(data.week_key)
  }

  const refreshCurrentWeek = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [weeksResult, data] = await Promise.all([fetchBudgetWeeks(), fetchWeeklySummary()])
      setAnchorWeekKey(data.week_key)
      setKnownWeekKeys(buildKnownWeekKeys(weeksResult.weeks ?? [], data.week_key))
      cacheWeekSummary(data)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    void refreshCurrentWeek()

    onCleanup(() => {
      window.removeEventListener('scroll', handleScroll)
    })
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
    return getWeekTabLabel(currentSummary()?.week_key, anchorWeekKey())
  })

  const disableFutureSpendMeta = createMemo(() => {
    const data = currentSummary()
    const anchor = anchorWeekKey()
    if (!data || !anchor) return false
    return compareWeekKey(data.week_key, anchor) > 0 && data.total_spent === 0 && data.record_count === 0
  })

  const loadRecordsForWeek = async (weekKey: string) => {
    if (untrack(() => recordsByWeek()[weekKey])) return
    if (untrack(() => recordsLoadingByWeek()[weekKey])) return

    setRecordsLoadingByWeek((prev) => ({ ...prev, [weekKey]: true }))
    setRecordsErrorByWeek((prev) => ({ ...prev, [weekKey]: null }))

    try {
      const records = await fetchWeeklySpendRecords(weekKey)
      setRecordsByWeek((prev) => ({ ...prev, [weekKey]: records }))
    } catch (error) {
      setRecordsErrorByWeek((prev) => ({ ...prev, [weekKey]: (error as Error).message }))
    } finally {
      setRecordsLoadingByWeek((prev) => ({ ...prev, [weekKey]: false }))
    }
  }

  createEffect(() => {
    const weekKey = currentSummary()?.week_key
    if (activePage() !== 'records' || !weekKey || disableFutureSpendMeta()) return
    void loadRecordsForWeek(weekKey)
  })

  const currentWeekRecords = createMemo(() => {
    const weekKey = currentSummary()?.week_key
    if (!weekKey) return []
    return recordsByWeek()[weekKey] ?? []
  })

  const recordsLoading = createMemo(() => {
    const weekKey = currentSummary()?.week_key
    if (!weekKey) return false
    return recordsLoadingByWeek()[weekKey] ?? false
  })

  const recordsErrorMessage = createMemo(() => {
    const weekKey = currentSummary()?.week_key
    if (!weekKey) return null
    return recordsErrorByWeek()[weekKey] ?? null
  })

  return (
    <div class="flex min-h-screen flex-col bg-background text-foreground">
      <main class="mx-auto w-full max-w-2xl flex-1 p-4 pt-24 md:p-8 md:pt-28">
        <Show
          when={activePage() === 'dashboard'}
          fallback={
            <SpendRecordsPage
              weekKey={currentSummary()?.week_key ?? '-'}
              records={currentWeekRecords()}
              loading={recordsLoading()}
              errorMessage={recordsErrorMessage()}
              onBack={() => setActivePage('dashboard')}
            />
          }
        >
          <section aria-label="Dashboard">
            {errorMessage() && (
              <div class="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage()}
              </div>
            )}

            <WeeklyBudgetCard
              title="주간 예산"
              summary={currentSummary() ?? emptySummary}
              loading={loading()}
              canGoPrev={canGoPrev()}
              canGoNext={canGoNext()}
              onPrev={() => moveKnownWeek(-1)}
              onNext={() => moveKnownWeek(1)}
              onRefresh={() => void refreshCurrentWeek()}
              weekTabLabel={weekTabLabel()}
              usagePercent={usagePercent()}
              disableFutureSpendMeta={disableFutureSpendMeta()}
              onOpenRecordsPage={() => setActivePage('records')}
            />
          </section>
        </Show>
      </main>

      <footer class="mx-auto w-full max-w-2xl px-4 pb-6 text-center text-sm text-muted-foreground md:px-8">
        <span>Copyright &copy; {currentYear} </span>
        <a
          href="https://github.com/tyange"
          target="_blank"
          rel="noreferrer"
          class="transition-colors hover:text-foreground"
        >
          tyange
        </a>
      </footer>

      <nav
        aria-label="Floating navigation"
        class={`fixed left-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-2 backdrop-blur-xl transition-all duration-300 ease-out ${
          isScrolled() ? 'bg-black/80 shadow-lg shadow-black/30' : ''
        }`}
      >
        <Show
          when={activePage() === 'dashboard'}
          fallback={
            <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white">
              <button
                type="button"
                onClick={() => setActivePage('dashboard')}
                class="inline-flex items-center text-sm font-medium text-white/80 transition-colors hover:text-white"
                aria-label="뒤로 가기"
              >
                ←
              </button>
              <span class="text-sm font-medium text-white">소비 기록</span>
              <span class="text-xs font-medium text-white/50">{currentSummary()?.week_key ?? '-'}</span>
            </div>
          }
        >
          <a
            href="#weekly-budget"
            aria-current="page"
            class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
              <path
                d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"
                fill="currentColor"
              />
            </svg>
            <span>주간 예산</span>
          </a>
        </Show>
      </nav>

      <PWABadge />
    </div>
  )
}

export default App
