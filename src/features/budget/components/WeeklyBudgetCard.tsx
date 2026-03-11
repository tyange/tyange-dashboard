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

export default function WeeklyBudgetCard(props: WeeklyBudgetCardProps) {
  const heroPanel = 'rounded-2xl border border-border/80 bg-card/70 p-6 shadow-[0_10px_24px_rgba(2,6,23,0.18)]'
  const toolbarButton =
    'h-9 min-w-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45'
  const viewMoreButton =
    'group inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 text-[11px] font-semibold tracking-[0.01em] text-primary transition-all hover:border-primary/35 hover:bg-primary/16 hover:text-primary'
  const surfacePanel = 'rounded-[28px] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3 shadow-[0_18px_40px_rgba(2,6,23,0.16)]'
  const metricTile = 'rounded-2xl bg-background/55 px-5 py-4 ring-1 ring-white/5 backdrop-blur-sm'
  const overspent = props.summary.is_overspent ?? props.summary.remaining_budget < 0
  const remainingTone = overspent ? 'text-destructive' : 'text-foreground'
  const statusTone = overspent
    ? 'bg-destructive/15 text-destructive'
    : props.summary.alert
      ? 'bg-amber-500/15 text-amber-200'
      : 'bg-emerald-500/15 text-emerald-200'
  const statusLabel = overspent ? '예산 초과' : props.summary.alert ? '경고' : '정상'

  return (
    <article id="active-budget">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="m-0 text-2xl font-semibold tracking-tight text-foreground">{props.title}</h1>
          <p class="mt-1 text-sm text-muted-foreground">활성 기간 총예산과 사용 현황을 확인하세요</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class={toolbarButton} onClick={props.onRefresh}>
            ↻
          </button>
          <span class="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
            {props.loading ? '조회중...' : `${props.summary.from_date} ~ ${props.summary.to_date}`}
          </span>
        </div>
      </header>

      <section class={`${heroPanel} mb-6 overflow-hidden`}>
        <div class="mb-6 flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">남은 예산</span>
          <div class="flex items-center gap-2">
            <span class={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{statusLabel}</span>
            <span class="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
              사용률 {props.usagePercent.toFixed(1)}%
            </span>
          </div>
        </div>
        <div class="mb-6">
          <span class={`text-4xl font-bold tracking-tight md:text-5xl ${remainingTone}`}>
            {krwFormatter.format(props.summary.remaining_budget)}
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
          {overspent && <p class="text-sm font-medium text-destructive">예산 초과 상태입니다. 남은 예산이 음수로 집계되었습니다.</p>}
          {!overspent && props.summary.alert && <p class="text-sm font-medium text-amber-200">알림 기준에 도달했습니다.</p>}
        </div>
      </section>

      <section class={`${surfacePanel} mb-6`}>
        <div class="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div class={`${metricTile} min-h-40`}>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Budget</p>
                <p class="mt-3 text-3xl font-semibold text-foreground tabular-nums md:text-4xl">
                  {krwFormatter.format(props.summary.total_budget)}
                </p>
              </div>
              <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {props.summary.from_date} ~ {props.summary.to_date}
              </span>
            </div>
            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl bg-secondary/35 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.14em] text-muted-foreground">Spent</p>
                <p class="mt-2 text-xl font-semibold text-foreground tabular-nums">
                  {krwFormatter.format(props.summary.total_spent)}
                </p>
              </div>
              <div class="rounded-xl bg-secondary/35 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.14em] text-muted-foreground">Alert</p>
                <p class="mt-2 text-xl font-semibold text-foreground tabular-nums">
                  {(props.summary.alert_threshold * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div class={`${metricTile} flex min-h-40 flex-col justify-between`}>
              <div class="flex items-center justify-between gap-3">
                <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                <span class={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{statusLabel}</span>
              </div>
              <div>
                <p class={`text-3xl font-semibold tracking-tight md:text-4xl ${remainingTone}`}>
                  {krwFormatter.format(props.summary.remaining_budget)}
                </p>
                <p class={`mt-2 text-sm ${props.summary.alert ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {overspent
                    ? '예산 초과 상태입니다.'
                    : props.summary.alert
                      ? '알림 기준에 도달했습니다.'
                      : '안정적인 예산 범위입니다.'}
                </p>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  class={`h-full rounded-full transition-[width] duration-500 ${props.summary.alert ? 'bg-destructive' : 'bg-accent'}`}
                  style={{ width: `${props.usagePercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              class={`${metricTile} group flex min-h-40 flex-col justify-between text-left transition hover:bg-background/70`}
              onClick={props.onOpenRecordsPage}
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Records</p>
                <span class={viewMoreButton}>
                  <span>Open</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true" class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                    <path
                      d="M5.25 3.75 9.5 8l-4.25 4.25"
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                    />
                  </svg>
                </span>
              </div>
              <div>
                <p class="text-2xl font-semibold text-foreground">소비 기록</p>
                <p class="mt-2 text-sm text-muted-foreground">주차 그룹과 상세 거래를 바로 확인합니다.</p>
              </div>
            </button>
          </div>
        </div>
      </section>
    </article>
  )
}
