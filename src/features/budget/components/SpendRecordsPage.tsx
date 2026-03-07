import { For, Show } from 'solid-js'
import { krwFormatter } from '../format'
import type { WeeklySpendRecord } from '../types'

export type SpendRecordsPageProps = {
  weekKey: string
  records: WeeklySpendRecord[]
  loading: boolean
  errorMessage: string | null
  onBack: () => void
}

export default function SpendRecordsPage(props: SpendRecordsPageProps) {
  const card = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const backButton =
    'inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted'

  const formatRecordDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' })
  }

  return (
    <article aria-label="소비 기록 페이지">
      <section class={card}>
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-foreground">{props.weekKey}</p>
            <p class="mt-1 text-sm text-muted-foreground">총 {props.records.length}건</p>
          </div>
          <button type="button" class={backButton} onClick={props.onBack}>
            대시보드로
          </button>
        </div>

        <Show when={!props.loading} fallback={<p class="text-sm text-muted-foreground">소비 기록을 불러오는 중...</p>}>
          <Show when={!props.errorMessage} fallback={<p class="text-sm text-destructive">{props.errorMessage}</p>}>
            <Show when={props.records.length > 0} fallback={<p class="text-sm text-muted-foreground">소비 기록이 없습니다.</p>}>
              <ul class="space-y-2">
                <For each={props.records}>
                  {(record) => (
                    <li class="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/20 px-3 py-2">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-foreground">{record.merchant || '기타 지출'}</p>
                        <p class="mt-0.5 text-xs text-muted-foreground">{formatRecordDate(record.transacted_at)}</p>
                      </div>
                      <span class="pl-4 text-sm font-semibold text-foreground tabular-nums">
                        {krwFormatter.format(record.amount)}
                      </span>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </Show>
      </section>
    </article>
  )
}
