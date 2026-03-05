import { createMemo, createSignal, onMount } from 'solid-js'
import { Skeleton } from '@kobalte/core/skeleton'
import PWABadge from './PWABadge'
import {
  fetchBudgetWeeks,
  fetchWeeklySummary,
  fetchWeeklySummaryByWeekKey,
} from './features/budget/api'
import WeeklyBudgetCard from './features/budget/components/WeeklyBudgetCard'
import { getDashboardSections, getLoadingSections } from './features/budget/sections'
import type { FolderSection, WeeklySummary } from './features/budget/types'
import { compareWeekKey, getWeekTabLabel } from './features/budget/weekKey'

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

  const sections = createMemo<FolderSection[]>(() => {
    const data = currentSummary()
    if (!data || loading()) return getLoadingSections()
    return getDashboardSections(data)
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
              section.id === 'weekly-budget' && currentSummary() ? (
                <WeeklyBudgetCard
                  title={section.title}
                  summary={currentSummary()!}
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
              ) : (
                <article
                  id={section.id}
                  class={`mb-4 break-inside-avoid rounded-2xl border border-slate-300/70 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${sizeClassByKey[section.size]} ${toneClassByKey[section.tone]}`}
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
                      <p class="m-0 text-lg font-semibold tracking-wide text-slate-500/90">
                        Coming Soon
                      </p>
                    </div>
                  ) : null}
                </article>
              )
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
