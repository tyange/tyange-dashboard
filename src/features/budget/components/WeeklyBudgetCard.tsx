import { Button } from '@kobalte/core/button'
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
  return (
    <article
      id="weekly-budget"
      class="mb-4 break-inside-avoid rounded-2xl border border-slate-300/70 bg-white/95 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] min-h-80"
      onTouchStart={props.onTouchStart}
      onTouchEnd={props.onTouchEnd}
    >
      <div class="flex items-center justify-between">
        <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">{props.title}</p>
        <div class="flex items-center gap-1.5">
          <Button
            class={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
              props.canGoPrev
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            }`}
            disabled={!props.canGoPrev}
            onClick={props.onPrev}
          >
            이전 주
          </Button>
          <Button
            class={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
              props.canGoNext
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            }`}
            disabled={!props.canGoNext}
            onClick={props.onNext}
          >
            다음 주
          </Button>
          <Button
            class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={props.onRefresh}
          >
            이번 주
          </Button>
          <Button
            class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={props.onRefresh}
          >
            새로고침
          </Button>
          <span class="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {props.loading ? '조회중...' : props.weekTabLabel}
          </span>
        </div>
      </div>
      <div class="mt-4 rounded-xl border border-slate-200 bg-white/90 p-4">
        <p class="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">남은 예산</p>
        <p class="mt-2 mb-0 text-4xl leading-none font-bold tracking-tight tabular-nums text-slate-900">
          {krwFormatter.format(props.summary.remaining)}
        </p>
        <div class="mt-4">
          <div class="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>사용률</span>
            <span class="tabular-nums">{props.usagePercent.toFixed(1)}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              class={`h-full rounded-full ${props.summary.alert ? 'bg-rose-500' : 'bg-slate-700'}`}
              style={{ width: `${props.usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2">
        <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
          <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주차</p>
          <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">{props.summary.week_key}</p>
        </div>
        <div
          class={`rounded-lg border border-slate-200 bg-white/80 p-3 ${
            props.disableFutureSpendMeta ? 'opacity-40 grayscale' : ''
          }`}
          aria-disabled={props.disableFutureSpendMeta}
        >
          <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">기록 수</p>
          <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
            {props.disableFutureSpendMeta ? '-' : `${props.summary.record_count}건`}
          </p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white/80 p-3">
          <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">주간 한도</p>
          <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
            {krwFormatter.format(props.summary.weekly_limit)}
          </p>
        </div>
        <div
          class={`rounded-lg border border-slate-200 bg-white/80 p-3 ${
            props.disableFutureSpendMeta ? 'opacity-40 grayscale' : ''
          }`}
          aria-disabled={props.disableFutureSpendMeta}
        >
          <p class="m-0 text-[11px] uppercase tracking-[0.08em] text-slate-500">총 지출</p>
          <p class="mt-1 mb-0 text-lg font-semibold tabular-nums">
            {props.disableFutureSpendMeta ? '-' : krwFormatter.format(props.summary.total_spent)}
          </p>
        </div>
      </div>

      <div class="mt-3 inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium">
        알림: {props.summary.alert ? 'ON' : 'OFF'}
      </div>
      <p class="mt-2 mb-0 text-[11px] text-slate-400">카드를 좌우로 스와이프해서 주차 전환</p>
    </article>
  )
}
