import { useNavigate } from '@solidjs/router'
import { createEffect, createMemo, createSignal, onMount, untrack } from 'solid-js'
import {
  fetchBudgetWeeks,
  fetchWeeklySummary,
  fetchWeeklySummaryByWeekKey,
} from '../api'
import type { WeeklySummary } from '../types'
import { compareWeekKey, getWeekTabLabel } from '../weekKey'
import WeeklyBudgetCard from './WeeklyBudgetCard'

const emptySummary: WeeklySummary = {
  week_key: '-',
  weekly_limit: 0,
  total_spent: 0,
  remaining: 0,
  usage_rate: 0,
  alert: false,
  record_count: 0,
}

export default function BudgetDashboardPage() {
  const navigate = useNavigate()
  const [summaryByWeek, setSummaryByWeek] = createSignal<Record<string, WeeklySummary>>({})
  const [knownWeekKeys, setKnownWeekKeys] = createSignal<string[]>([])
  const [currentWeekKey, setCurrentWeekKey] = createSignal<string | null>(null)
  const [anchorWeekKey, setAnchorWeekKey] = createSignal<string | null>(null)
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

  const weekTabLabel = createMemo(() => getWeekTabLabel(currentSummary()?.week_key, anchorWeekKey()))

  const disableFutureSpendMeta = createMemo(() => {
    const data = currentSummary()
    const anchor = anchorWeekKey()
    if (!data || !anchor) return false
    return compareWeekKey(data.week_key, anchor) > 0 && data.total_spent === 0 && data.record_count === 0
  })

  const openRecordsPage = () => {
    const weekKey = untrack(() => currentSummary()?.week_key)
    if (!weekKey) return
    void navigate(`/records?week=${encodeURIComponent(weekKey)}`)
  }

  createEffect(() => {
    const weekKey = currentSummary()?.week_key
    if (!weekKey) return
    setSummaryByWeek((prev) => (prev[weekKey] ? prev : { ...prev, [weekKey]: currentSummary() ?? emptySummary }))
  })

  return (
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
        onOpenRecordsPage={openRecordsPage}
      />
    </section>
  )
}
