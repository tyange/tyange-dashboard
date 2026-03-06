import { createEffect, createSignal, For, on, Show } from 'solid-js'
import { fetchConsumptionRecords } from '../api'
import { krwFormatter } from '../format'
import type { ConsumptionRecord } from '../types'

export type ConsumptionRecordListProps = {
  weekKey: string
  isOpen: boolean
  onClose: () => void
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function ConsumptionRecordList(props: ConsumptionRecordListProps) {
  const [records, setRecords] = createSignal<ConsumptionRecord[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const loadRecords = async () => {
    if (!props.weekKey || props.weekKey === '-') return

    setLoading(true)
    setError(null)
    try {
      const response = await fetchConsumptionRecords(props.weekKey)
      setRecords(response.records)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  createEffect(
    on(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen) {
          void loadRecords()
        }
      }
    )
  )

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-list-title"
      >
        <div class="mx-4 flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <header class="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id="record-list-title" class="text-lg font-semibold text-foreground">
              소비 기록
            </h2>
            <div class="flex items-center gap-3">
              <span class="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
                {props.weekKey}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={props.onClose}
                aria-label="닫기"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto">
            <Show when={loading()}>
              <div class="flex items-center justify-center py-12">
                <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span class="ml-3 text-sm text-muted-foreground">불러오는 중...</span>
              </div>
            </Show>

            <Show when={error()}>
              <div class="px-5 py-8 text-center">
                <p class="text-sm text-destructive">{error()}</p>
                <button
                  type="button"
                  class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  onClick={() => void loadRecords()}
                >
                  다시 시도
                </button>
              </div>
            </Show>

            <Show when={!loading() && !error() && records().length === 0}>
              <div class="px-5 py-12 text-center">
                <p class="text-muted-foreground">이 주차에 기록된 소비 내역이 없습니다.</p>
              </div>
            </Show>

            <Show when={!loading() && !error() && records().length > 0}>
              <ul class="divide-y divide-border">
                <For each={records()}>
                  {(record) => (
                    <li class="px-5 py-4 transition hover:bg-muted/50">
                      <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0 flex-1">
                          <p class="truncate font-medium text-foreground">{record.place}</p>
                          <p class="mt-1 text-sm text-muted-foreground">
                            {formatDateTime(record.created_at)}
                          </p>
                        </div>
                        <p class="shrink-0 text-lg font-semibold tabular-nums text-foreground">
                          {krwFormatter.format(record.amount)}
                        </p>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>

          <footer class="border-t border-border px-5 py-3 text-center text-sm text-muted-foreground">
            총 {records().length}건
          </footer>
        </div>
      </div>
    </Show>
  )
}
