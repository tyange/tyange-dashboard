import { createMemo, createResource } from 'solid-js'
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

function App() {
  const [summary, { refetch }] = createResource(fetchWeeklySummary)

  const sections = createMemo<FolderSection[]>(() => {
    const data = summary()
    if (!data) {
      return [
        {
          id: 'loading-weekly-budget',
          title: 'Weekly Budget',
          size: 'md',
          tone: 'slate',
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
  const usagePercent = createMemo(() => {
    const value = summary()?.usage_rate ?? 0
    return Math.max(0, Math.min(100, value * 100))
  })

  return (
    <div class="flex min-h-screen flex-col bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.6),transparent_30%),linear-gradient(180deg,#f5f5f5_0%,#e7e7e7_100%)] text-slate-900">
      <main class="flex flex-1 items-center justify-center p-6 max-[820px]:p-4">
        <section aria-label="Dashboard" class="w-full max-w-[920px]">
          <div class="mb-3 flex items-center justify-end">
            <button
              type="button"
              class="rounded-lg border border-slate-400/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>

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
              >
                {section.isDummy ? (
                  <div class="flex min-h-[inherit] items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/40">
                    <p class="m-0 text-lg font-semibold tracking-wide text-slate-500/90">Coming Soon</p>
                  </div>
                ) : section.id === 'weekly-budget' && summary() ? (
                  <>
                    <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
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
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">기록 수</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">{summary()!.record_count}건</p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주간 한도</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {krwFormatter.format(summary()!.weekly_limit)}
                        </p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
                        <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">총 지출</p>
                        <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
                          {krwFormatter.format(summary()!.total_spent)}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium">
                      알림: {summary()!.alert ? 'ON' : 'OFF'}
                    </div>
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
