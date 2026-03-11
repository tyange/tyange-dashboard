import { krwFormatter } from '../format'
import type { BudgetSummary } from '../types'

export type WeeklyBudgetCardProps = {
  title: string
  summary: BudgetSummary
  loading: boolean
  onRefresh: () => void
  usagePercent: number
  onOpenRecordsPage: () => void
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

export default function WeeklyBudgetCard(props: WeeklyBudgetCardProps) {
  const remainingBudget = () => Number(props.summary.remaining_budget)
  const overspent = () => props.summary.is_overspent === true || remainingBudget() < 0
  const warning = () => !overspent() && props.summary.alert === true
  const ringColor = () => (overspent() || warning() ? '#ef4444' : '#20c997')
  const heroTone = () =>
    overspent() || warning()
      ? 'border-red-500/30 bg-[linear-gradient(180deg,rgba(90,10,18,0.55),rgba(18,4,7,0.88))]'
      : 'border-white/8 bg-[linear-gradient(180deg,rgba(5,17,20,0.9),rgba(4,8,16,0.92))]'
  const ringStyle = () => ({
    background: `conic-gradient(${ringColor()} 0deg ${(props.usagePercent / 100) * 360}deg, rgba(255,255,255,0.08) ${(props.usagePercent / 100) * 360}deg 360deg)`,
  })

  return (
    <article id="active-budget" class="space-y-6">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-[2.75rem]">{props.title}</h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/8 bg-black/35 px-5 py-3 text-sm text-white/88 backdrop-blur-xl">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/12 text-accent">
              <CalendarIcon />
            </span>
            <span>{props.summary.from_date} ~ {props.summary.to_date}</span>
          </div>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-full border border-white/8 bg-white/4 px-4 text-sm font-medium text-white/72 transition hover:bg-white/8 hover:text-white"
            onClick={props.onRefresh}
          >
            {props.loading ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </header>

      <section class={`overflow-hidden rounded-[2rem] border p-8 shadow-[0_24px_60px_rgba(0,0,0,0.32)] ${heroTone()}`}>
        <div class="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_320px] xl:items-center">
          <div class="relative">
            <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent shadow-[inset_0_0_0_1px_rgba(32,201,151,0.1)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="h-7 w-7">
                <path
                  d="M6 7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5v9A2.5 2.5 0 0 1 15.5 19h-7A2.5 2.5 0 0 1 6 16.5v-9ZM9 9h6M9 12h6M9 15h3"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.7"
                />
              </svg>
            </div>
            <p class="mt-6 text-lg font-medium text-white/48">잔여 예산</p>
            <p class={`mt-4 text-5xl font-semibold tracking-tight sm:text-6xl ${overspent() || warning() ? 'text-red-400' : 'text-foreground'}`}>
              {krwFormatter.format(props.summary.remaining_budget)}
            </p>
            <p class="mt-5 text-sm text-white/42">총 예산 {krwFormatter.format(props.summary.total_budget)}</p>
          </div>

          <div class="relative flex justify-center xl:justify-end">
            <div class="absolute inset-x-6 top-6 hidden h-40 rounded-[2.5rem] bg-accent/6 blur-2xl xl:block" />
            <div class="relative flex h-60 w-60 items-center justify-center rounded-full border border-white/8 bg-black/28 backdrop-blur-md">
              <div class="absolute inset-4 rounded-full" style={ringStyle()} />
              <div class="absolute inset-9 rounded-full bg-[rgba(4,10,18,0.96)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
              <div class="relative text-center">
                <p class="text-5xl font-semibold tracking-tight text-foreground">{Math.round(props.usagePercent)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <article class="rounded-[1.75rem] border border-white/8 bg-black/28 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <p class="text-lg font-medium text-white/48">지출</p>
            <p class="mt-5 text-4xl font-semibold tracking-tight text-foreground">{krwFormatter.format(props.summary.total_spent)}</p>
            <div class="mt-8 flex items-center justify-between gap-3">
              <span class="text-sm text-white/40">원장 기준 집계</span>
              <button
                type="button"
                class="group inline-flex items-center gap-2 rounded-full border border-emerald-500/24 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-emerald-500/16"
                onClick={props.onOpenRecordsPage}
              >
                소비 기록 보기
                <svg viewBox="0 0 16 16" aria-hidden="true" class="h-4 w-4 transition-transform group-hover:translate-x-0.5">
                  <path
                    d="M5.25 3.75 9.5 8l-4.25 4.25"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                  />
                </svg>
              </button>
            </div>
        </article>
      </section>
    </article>
  )
}
