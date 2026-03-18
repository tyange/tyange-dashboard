import { krwFormatter } from '../format'
import type { BudgetSummary } from '../types'

export type WeeklyBudgetCardProps = {
  title: string
  summary: BudgetSummary
  usagePercent: number
}

export default function WeeklyBudgetCard(props: WeeklyBudgetCardProps) {
  const remainingBudget = () => Number(props.summary.remaining_budget)
  const overspent = () => props.summary.is_overspent === true || remainingBudget() < 0
  const warning = () => !overspent() && props.summary.alert === true
  const usageTone = () => (overspent() ? 'bg-red-500' : warning() ? 'bg-amber-500' : 'bg-accent')
  const usageLabel = () => (overspent() ? '초과 상태' : warning() ? '경고 상태' : '정상 범위')
  const section = 'border-t border-border/70 pt-8'
  const statCell = 'rounded-2xl border border-border/70 bg-background/78 px-4 py-4'
  return (
    <article id="active-budget" class="space-y-8">
      <header>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Budget</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{props.title}</h1>
        </div>
      </header>

      <section class="border-b border-t border-border/70 py-5">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">적용 기간</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {props.summary.from_date} ~ {props.summary.to_date}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">총예산</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(props.summary.total_budget)}</p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">총지출</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(props.summary.total_spent)}</p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">잔여</p>
              <p class={`mt-2 text-2xl font-semibold ${overspent() ? 'text-red-500' : 'text-foreground'}`}>
                {krwFormatter.format(props.summary.remaining_budget)}
              </p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">사용률</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">{Math.round(props.usagePercent)}%</p>
            </div>
          </div>
        </div>
      </section>

      <section class={section}>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Usage</p>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">예산 진행률</h2>
          </div>
          <span class={`rounded-full px-3 py-1.5 text-xs font-semibold ${overspent() ? 'bg-red-500/12 text-red-600' : warning() ? 'bg-amber-500/12 text-amber-700' : 'bg-accent/12 text-accent'}`}>
            {usageLabel()}
          </span>
        </div>

        <div class="mt-6">
          <div class="h-4 overflow-hidden rounded-full bg-secondary">
            <div
              class={`h-full rounded-full transition-all ${usageTone()}`}
              style={{ width: `${Math.min(100, Math.max(0, props.usagePercent))}%` }}
            />
          </div>
          <div class="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>지출 {krwFormatter.format(props.summary.total_spent)}</span>
            <span>잔여 {krwFormatter.format(props.summary.remaining_budget)}</span>
          </div>
        </div>
      </section>
    </article>
  )
}
