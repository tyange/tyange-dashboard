import { For, Show } from 'solid-js'
import { krwFormatter } from '../format'
import type { WeeklySpendRecord } from '../types'

export type SpendRecordsPageProps = {
  weekKey: string
  records: WeeklySpendRecord[]
  loading: boolean
  saving: boolean
  deletingRecordId: number | null
  editingRecordId: number | null
  amountInput: string
  merchantInput: string
  transactedAtInput: string
  errorMessage: string | null
  successMessage: string | null
  onAmountInput: (value: string) => void
  onMerchantInput: (value: string) => void
  onTransactedAtInput: (value: string) => void
  onSubmit: () => void
  onStartEditing: (record: WeeklySpendRecord) => void
  onCancelEditing: () => void
  onDelete: (recordId: number) => void
  onBack: () => void
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function formatRecordDate(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SpendRecordsPage(props: SpendRecordsPageProps) {
  const card = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const mutedButton =
    'inline-flex items-center justify-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'
  const primaryButton =
    'inline-flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
  const dangerButton =
    'inline-flex items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-60'
  const inputClass =
    'w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary'

  return (
    <article aria-label="소비 기록 페이지" class="space-y-4">
      <section class={card}>
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-foreground">{props.weekKey}</p>
            <p class="mt-1 text-sm text-muted-foreground">총 {props.records.length}건</p>
          </div>
          <button type="button" class={mutedButton} onClick={props.onBack}>
            대시보드로
          </button>
        </div>
      </section>

      <section class={card}>
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-foreground">{props.editingRecordId ? '소비 기록 수정' : '소비 기록 추가'}</h2>
            <p class="mt-1 text-xs text-muted-foreground">수정 시 다른 주차로 이동하면 해당 주차 화면으로 바로 전환됩니다.</p>
          </div>
          <Show when={props.editingRecordId !== null}>
            <button type="button" class={mutedButton} onClick={props.onCancelEditing}>
              새 기록으로 전환
            </button>
          </Show>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-foreground">금액</span>
            <input
              type="text"
              inputmode="numeric"
              value={props.amountInput}
              onInput={(event) => props.onAmountInput(digitsOnly(event.currentTarget.value))}
              class={inputClass}
              placeholder="예: 12000"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-foreground">가맹점</span>
            <input
              type="text"
              value={props.merchantInput}
              onInput={(event) => props.onMerchantInput(event.currentTarget.value)}
              class={inputClass}
              placeholder="예: 스타벅스"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-foreground">사용 일시</span>
            <input
              type="datetime-local"
              value={props.transactedAtInput}
              onInput={(event) => props.onTransactedAtInput(event.currentTarget.value)}
              class={inputClass}
            />
          </label>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <Show when={props.editingRecordId !== null}>
            <button type="button" class={mutedButton} onClick={props.onCancelEditing} disabled={props.saving}>
              취소
            </button>
          </Show>
          <button type="button" class={primaryButton} onClick={props.onSubmit} disabled={props.saving}>
            {props.saving ? '저장 중...' : props.editingRecordId ? '수정 저장' : '기록 저장'}
          </button>
        </div>

        <Show when={props.errorMessage}>
          <p class="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {props.errorMessage}
          </p>
        </Show>

        <Show when={props.successMessage}>
          <p class="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {props.successMessage}
          </p>
        </Show>
      </section>

      <section class={card}>
        <Show when={!props.loading} fallback={<p class="text-sm text-muted-foreground">소비 기록을 불러오는 중...</p>}>
          <Show when={props.records.length > 0} fallback={<p class="text-sm text-muted-foreground">소비 기록이 없습니다.</p>}>
            <ul class="space-y-2">
              <For each={props.records}>
                {(record) => (
                  <li class="flex flex-col gap-3 rounded-lg border border-border/80 bg-secondary/20 px-3 py-3 md:flex-row md:items-center md:justify-between">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-foreground">{record.merchant || '기타 지출'}</p>
                      <p class="mt-0.5 text-xs text-muted-foreground">{formatRecordDate(record.transacted_at)}</p>
                    </div>

                    <div class="flex items-center justify-between gap-3 md:justify-end">
                      <span class="text-sm font-semibold text-foreground tabular-nums">
                        {krwFormatter.format(record.amount)}
                      </span>
                      <div class="flex items-center gap-2">
                        <button type="button" class={mutedButton} onClick={() => props.onStartEditing(record)} disabled={props.saving}>
                          수정
                        </button>
                        <button
                          type="button"
                          class={dangerButton}
                          onClick={() => props.onDelete(record.record_id)}
                          disabled={props.deletingRecordId !== null}
                        >
                          {props.deletingRecordId === record.record_id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
      </section>
    </article>
  )
}
