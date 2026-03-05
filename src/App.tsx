import { createMemo, createSignal, onMount } from 'solid-js'
import PWABadge from './PWABadge'
import {
  fetchBudgetWeeks,
  fetchWeeklySummary,
  fetchWeeklySummaryByWeekKey,
} from './features/budget/api'
import WeeklyBudgetCard from './features/budget/components/WeeklyBudgetCard'
import type { WeeklySummary } from './features/budget/types'
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
  const [summaryByWeek, setSummaryByWeek] = createSignal<Record<string, WeeklySummary>>({})
  const [knownWeekKeys, setKnownWeekKeys] = createSignal<string[]>([])
  const [currentWeekKey, setCurrentWeekKey] = createSignal<string | null>(null)
  const [anchorWeekKey, setAnchorWeekKey] = createSignal<string | null>(null)
  const [touchStartX, setTouchStartX] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

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
    void refreshCurrentWeek()
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

  const handleWeeklyTouchStart = (event: TouchEvent) => {
    setTouchStartX(event.touches[0]?.clientX ?? null)
  }

  const handleWeeklyTouchEnd = (event: TouchEvent) => {
    const startX = touchStartX()
    const endX = event.changedTouches[0]?.clientX
    if (startX == null || endX == null) return
    const diff = endX - startX
    if (diff <= -40 && canGoNext()) moveKnownWeek(1)
    if (diff >= 40 && canGoPrev()) moveKnownWeek(-1)
    setTouchStartX(null)
  }

  return (
    <div class="min-h-screen bg-background text-foreground">
      <main class="mx-auto max-w-2xl p-4 md:p-8">
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
            onTouchStart={handleWeeklyTouchStart}
            onTouchEnd={handleWeeklyTouchEnd}
          />
        </section>
      </main>

      <PWABadge />
    </div>
  )
}

export default App
