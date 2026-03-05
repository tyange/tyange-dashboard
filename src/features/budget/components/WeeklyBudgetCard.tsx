import type { JSX } from 'solid-js'
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
  onTouchStart: JSX.EventHandlerUnion<HTMLElement, TouchEvent>
  onTouchEnd: JSX.EventHandlerUnion<HTMLElement, TouchEvent>
}

export default function WeeklyBudgetCard(props: WeeklyBudgetCardProps) {
  const isAlertOn = () => props.summary.alert && !props.disableFutureSpendMeta

  const metaCard = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const toolbarButton =
    'h-9 min-w-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45'

  return (
    <article id="weekly-budget" onTouchStart={props.onTouchStart} onTouchEnd={props.onTouchEnd}>
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
        <div class={`${metaCard} ${props.disableFutureSpendMeta ? 'opacity-40 grayscale' : ''}`} aria-disabled={props.disableFutureSpendMeta}>
          <p class="text-sm text-muted-foreground">기록 수</p>
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

      <section class={metaCard}>
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-medium text-foreground">알림</p>
            <p class="text-sm text-muted-foreground">
              {isAlertOn() ? '알림이 활성화되었습니다' : '알림이 비활성화되었습니다'}
            </p>
          </div>
          <div
            class={`relative h-6 w-11 rounded-full border border-border transition ${
              isAlertOn() ? 'bg-primary/30' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={isAlertOn()}
            aria-label="알림 상태"
          >
            <span
              class={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-foreground transition ${
                isAlertOn() ? 'left-[1.3rem]' : 'left-0.5'
              }`}
            />
          </div>
        </div>
      </section>
      <p class="mt-6 text-center text-sm text-muted-foreground">카드를 좌우로 스와이프해서 주차 전환</p>
    </article>
  )
}
