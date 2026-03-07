import { For, Show, createSignal, onMount } from 'solid-js'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { fetchWeeklyRecords } from '../api'
import { krwFormatter } from '../format'
import type { SpendRecord } from '../types'

export type RecordListModalProps = {
  weekKey: string
  isOpen: boolean
  onClose: () => void
}

export default function RecordListModal(props: RecordListModalProps) {
  const [records, setRecords] = createSignal<SpendRecord[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const loadRecords = async () => {
    if (!props.weekKey || props.weekKey === '-') return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeeklyRecords(props.weekKey)
      setRecords(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    if (props.isOpen) {
      void loadRecords()
    }
  })

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'M월 d일 (EEE) HH:mm', { locale: ko })
    } catch {
      return dateString
    }
  }

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose()
        }}
      >
        <div class="mx-4 max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <header class="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 class="text-lg font-semibold text-foreground">소비 기록</h2>
              <p class="mt-0.5 text-sm text-muted-foreground">{props.weekKey}</p>
            </div>
            <button
              type="button"
              onClick={props.onClose}
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition hover:bg-muted"
              aria-label="닫기"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="max-h-[60vh] overflow-y-auto p-6">
            <Show when={loading()}>
              <div class="flex items-center justify-center py-12">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
              </div>
            </Show>

            <Show when={error()}>
              <div class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error()}
              </div>
            </Show>

            <Show when={!loading() && !error()}>
              <Show when={records().length === 0}>
                <div class="py-12 text-center text-muted-foreground">
                  이 주차에 기록된 소비 내역이 없습니다.
                </div>
              </Show>

              <Show when={records().length > 0}>
                <ul class="space-y-3">
                  <For each={records()}>
                    {(record) => (
                      <li class="rounded-xl border border-border bg-secondary/50 p-4 transition hover:bg-secondary">
                        <div class="flex items-start justify-between gap-4">
                          <div class="min-w-0 flex-1">
                            <p class="truncate font-medium text-foreground">
                              {record.description || '(설명 없음)'}
                            </p>
                            <p class="mt-1 text-sm text-muted-foreground">
                              {formatDate(record.spent_at)}
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
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
