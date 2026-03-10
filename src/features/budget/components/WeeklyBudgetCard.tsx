import { krwFormatter } from '../format'
import type { WeeklySummary } from '../types'

export type WeeklyBudgetCardProps = {
  title: string
  summary: WeeklySummary
  loading: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onRefresh: () => void
  weekTabLabel: string
  usagePercent: number
  disableFutureSpendMeta: boolean
  onOpenRecordsPage: () => void
}

export default function WeeklyBudgetCard(props: WeeklyBudgetCardProps) {
  const metaCard = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const toolbarButton =
    'h-9 min-w-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45'
  const viewMoreButton =
    'group inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 text-[11px] font-semibold tracking-[0.01em] text-primary transition-all hover:border-primary/35 hover:bg-primary/16 hover:text-primary disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-45'
  const projectedRemainingTone =
    props.summary.projected_remaining < 0 ? 'text-destructive' : 'text-foreground'

  return (
    <article id="weekly-budget">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="m-0 text-2xl font-semibold tracking-tight text-foreground">{props.title}</h1>
          <p class="mt-1 text-sm text-muted-foreground">지출을 관리하고 예산을 추적하세요</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class={toolbarButton} onClick={props.onPrev} disabled={!props.canGoPrev}>
            ←
          </button>
          <button type="button" class={toolbarButton} onClick={props.onRefresh}>
            이번 주
          </button>
          <button type="button" class={toolbarButton} onClick={props.onNext} disabled={!props.canGoNext}>
            →
          </button>
          <button type="button" class={toolbarButton} onClick={props.onRefresh}>
            ↻
          </button>
          <span class="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
            {props.loading ? '조회중...' : props.weekTabLabel}
          </span>
        </div>
      </header>

      <section class={`${metaCard} mb-6 overflow-hidden`}>
        <div class="mb-6 flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">남은 예산</span>
          <span class="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
            {props.summary.week_key}
          </span>
        </div>
        <div class="mb-6">
          <span class="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {krwFormatter.format(props.summary.remaining)}
          </span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">사용률</span>
            <span class="font-medium text-foreground tabular-nums">{props.usagePercent.toFixed(1)}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              class={`h-full rounded-full transition-[width] duration-500 ${props.summary.alert ? 'bg-destructive' : 'bg-accent'}`}
              style={{ width: `${props.usagePercent}%` }}
            />
          </div>
        </div>
      </section>

      <section class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">주차</p>
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">{props.summary.week_key}</p>
        </div>
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">예상 잔여</p>
          <p class={`mt-1 text-xl font-semibold tabular-nums ${projectedRemainingTone}`}>
            {krwFormatter.format(props.summary.projected_remaining)}
          </p>
        </div>
        <div class={`${metaCard} ${props.disableFutureSpendMeta ? 'opacity-40 grayscale' : ''}`} aria-disabled={props.disableFutureSpendMeta}>
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-muted-foreground">기록 수</p>
            <button
              type="button"
              class={viewMoreButton}
              onClick={props.onOpenRecordsPage}
              disabled={props.disableFutureSpendMeta}
            >
              <span>더 보기</span>
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              >
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
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">
            {props.disableFutureSpendMeta ? '-' : `${props.summary.record_count}건`}
          </p>
        </div>
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">주간 한도</p>
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">
            {krwFormatter.format(props.summary.weekly_limit)}
          </p>
        </div>
        <div class={`${metaCard} ${props.disableFutureSpendMeta ? 'opacity-40 grayscale' : ''}`} aria-disabled={props.disableFutureSpendMeta}>
          <p class="text-sm text-muted-foreground">총 지출</p>
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">
            {props.disableFutureSpendMeta ? '-' : krwFormatter.format(props.summary.total_spent)}
          </p>
        </div>
      </section>
    </article>
  )
}
