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
  const metaCard = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const toolbarButton =
    'h-9 min-w-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45'
  const viewMoreButton =
    'group inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 text-[11px] font-semibold tracking-[0.01em] text-primary transition-all hover:border-primary/35 hover:bg-primary/16 hover:text-primary'
  const overspent = () => props.summary.is_overspent ?? props.summary.remaining_budget < 0
  const remainingTone = overspent() ? 'text-destructive' : 'text-foreground'
  const statusTone = () => (overspent() ? 'bg-destructive/15 text-destructive' : props.summary.alert ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200')
  const statusLabel = () => (overspent() ? '예산 초과' : props.summary.alert ? '경고' : '정상')

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

      <section class={`${metaCard} mb-6 overflow-hidden`}>
        <div class="mb-6 flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">남은 예산</span>
          <div class="flex items-center gap-2">
            <span class={`rounded-full px-3 py-1 text-xs font-medium ${statusTone()}`}>{statusLabel()}</span>
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
          {overspent() && <p class="text-sm font-medium text-destructive">예산 초과 상태입니다. 남은 예산이 음수로 집계되었습니다.</p>}
          {!overspent() && props.summary.alert && <p class="text-sm font-medium text-amber-200">알림 기준에 도달했습니다.</p>}
        </div>
      </section>

      <section class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">총예산</p>
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">{krwFormatter.format(props.summary.total_budget)}</p>
        </div>
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">활성 기간</p>
          <p class="mt-1 text-xl font-semibold text-foreground">{props.summary.from_date} ~ {props.summary.to_date}</p>
        </div>
        <div class={metaCard}>
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-muted-foreground">소비 기록</p>
            <button type="button" class={viewMoreButton} onClick={props.onOpenRecordsPage}>
              <span>더 보기</span>
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
            </button>
          </div>
          <p class="mt-1 text-xl font-semibold text-foreground">기록 목록 보기</p>
          <p class="mt-1 text-xs text-muted-foreground">주차 그룹은 표시용이며 계산은 전체 기간 총액 기준입니다.</p>
        </div>
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">총 지출</p>
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">{krwFormatter.format(props.summary.total_spent)}</p>
        </div>
        <div class={metaCard}>
          <p class="text-sm text-muted-foreground">알림 기준</p>
          <p class="mt-1 text-xl font-semibold text-foreground tabular-nums">
            {(props.summary.alert_threshold * 100).toFixed(0)}%
          </p>
          <p class={`mt-1 text-xs ${props.summary.alert ? 'text-destructive' : 'text-muted-foreground'}`}>
            {props.summary.alert ? '현재 경고 상태입니다.' : '경고 기준 이내입니다.'}
          </p>
        </div>
      </section>
    </article>
  )
}
