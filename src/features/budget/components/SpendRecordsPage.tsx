import { For, Show } from 'solid-js'
import { krwFormatter } from '../format'
import type {
  SpendRecord,
  SpendingImportCommitResponse,
  SpendingImportPreviewResponse,
  SpendingImportRowStatus,
  SpendingWeekGroup,
} from '../types'

export type SpendRecordsPageProps = {
  fromDate: string
  toDate: string
  totalSpent: number
  remainingBudget: number
  weekGroups: SpendingWeekGroup[]
  loading: boolean
  saving: boolean
  deletingRecordId: number | null
  editingRecordId: number | null
  amountInput: string
  merchantInput: string
  transactedAtInput: string
  errorMessage: string | null
  successMessage: string | null
  importFileName: string | null
  importPreview: SpendingImportPreviewResponse | null
  importResult: SpendingImportCommitResponse | null
  importMessage: string | null
  previewLoading: boolean
  commitLoading: boolean
  selectedFingerprints: string[]
  selectableFingerprintCount: number
  onAmountInput: (value: string) => void
  onMerchantInput: (value: string) => void
  onTransactedAtInput: (value: string) => void
  onSubmit: () => void
  onStartEditing: (record: SpendRecord) => void
  onCancelEditing: () => void
  onDelete: (recordId: number) => void
  onImportFileChange: (file: File | null) => void
  onRequestPreview: () => void
  onToggleFingerprint: (fingerprint: string, checked: boolean) => void
  onSelectAllFingerprints: () => void
  onClearSelectedFingerprints: () => void
  onCommitImport: () => void
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

function isSelectableStatus(status: SpendingImportRowStatus) {
  return status === 'new'
}

function statusBadgeClass(status: SpendingImportRowStatus) {
  switch (status) {
    case 'new':
      return 'bg-emerald-500/15 text-emerald-200'
    case 'duplicate':
      return 'bg-amber-500/15 text-amber-200'
    case 'out_of_period':
      return 'bg-sky-500/15 text-sky-200'
    case 'invalid':
      return 'bg-rose-500/15 text-rose-200'
  }
}

function statusLabel(status: SpendingImportRowStatus) {
  switch (status) {
    case 'new':
      return '신규'
    case 'duplicate':
      return '중복'
    case 'out_of_period':
      return '기간 외'
    case 'invalid':
      return '오류'
  }
}

export default function SpendRecordsPage(props: SpendRecordsPageProps) {
  const card = 'rounded-xl border border-border bg-card p-5 shadow-[0_10px_24px_rgba(2,6,23,0.22)]'
  const mutedButton =
    'inline-flex items-center justify-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'
  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
  const dangerButton =
    'inline-flex items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-60'
  const inputClass =
    'w-full rounded-2xl border border-border bg-background/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary'
  const allSelectableChecked = () =>
    props.selectableFingerprintCount > 0 && props.selectedFingerprints.length === props.selectableFingerprintCount

  return (
    <article aria-label="소비 기록 페이지" class="space-y-4">
      <section class={card}>
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-foreground">{props.fromDate} ~ {props.toDate}</p>
            <p class="mt-1 text-sm text-muted-foreground">
              총 지출 {krwFormatter.format(props.totalSpent)} · 잔여 {krwFormatter.format(props.remainingBudget)}
            </p>
          </div>
          <button type="button" class={mutedButton} onClick={props.onBack}>
            대시보드로
          </button>
        </div>
      </section>

      <section class={card}>
        <div class="flex flex-col gap-4">
          <div>
            <h2 class="text-sm font-semibold text-foreground">신한카드 XLS 가져오기</h2>
            <p class="mt-1 text-xs text-muted-foreground">
              파일 업로드 후 미리보기에서 신규 거래만 기본 선택됩니다. 중복, 기간 외, 오류 행은 반영할 수 없습니다.
            </p>
          </div>

          <div class="flex w-full max-w-xl flex-row items-center gap-3">
            <div class="block flex-1">
              <input
                type="file"
                accept=".xls,application/vnd.ms-excel"
                class="block w-full rounded-2xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-primary-foreground"
                onChange={(event) => props.onImportFileChange(event.currentTarget.files?.[0] ?? null)}
              />
            </div>

            <div class="flex shrink-0 items-center">
              <button
                type="button"
                class={`${primaryButton} min-w-28`}
                onClick={props.onRequestPreview}
                disabled={!props.importFileName || props.previewLoading || props.commitLoading}
              >
                {props.previewLoading ? '미리보기 중...' : '미리보기'}
              </button>
            </div>
          </div>
        </div>

        <Show when={props.importFileName}>
          {(fileName) => <p class="mt-3 text-xs text-muted-foreground">선택 파일: {fileName()}</p>}
        </Show>

        <Show when={props.importMessage}>
          {(message) => (
            <div class="mt-4 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              {message()}
            </div>
          )}
        </Show>

        <Show when={props.importPreview}>
          {(preview) => (
            <div class="mt-5 space-y-4">
              <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">신규 반영</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{preview().summary.new_count}건</p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">중복</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{preview().summary.duplicate_count}건</p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">기간 외</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">{preview().summary.out_of_period_count}건</p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">신규 금액</p>
                  <p class="mt-2 whitespace-nowrap text-base font-semibold text-foreground lg:text-lg">
                    {krwFormatter.format(preview().summary.new_amount_sum)}
                  </p>
                </article>
                <article class="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <p class="text-xs text-muted-foreground">신규 순지출</p>
                  <p class="mt-2 whitespace-nowrap text-base font-semibold text-foreground lg:text-lg">
                    {krwFormatter.format(preview().summary.new_net_amount_sum)}
                  </p>
                </article>
              </div>

              <div class="rounded-2xl border border-border/80 bg-secondary/15 p-4">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">
                      감지 소스 {preview().detected_source} · 전체 {preview().summary.parsed_count}건
                    </p>
                    <p class="mt-1 text-sm font-medium text-foreground">
                      반영 선택 {props.selectedFingerprints.length} / 선택 가능 {props.selectableFingerprintCount}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class={mutedButton}
                      onClick={props.onSelectAllFingerprints}
                      disabled={props.commitLoading || props.previewLoading || props.selectableFingerprintCount === 0 || allSelectableChecked()}
                    >
                      전체 선택
                    </button>
                    <button
                      type="button"
                      class={mutedButton}
                      onClick={props.onClearSelectedFingerprints}
                      disabled={props.commitLoading || props.previewLoading || props.selectedFingerprints.length === 0}
                    >
                      선택 해제
                    </button>
                    <button
                      type="button"
                      class={`${primaryButton} min-w-32`}
                      onClick={props.onCommitImport}
                      disabled={props.commitLoading || props.previewLoading || props.selectedFingerprints.length === 0}
                    >
                      {props.commitLoading ? '반영 중...' : '선택 항목 반영'}
                    </button>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto rounded-2xl border border-border/70">
                <table class="min-w-full border-collapse text-left text-sm">
                  <thead class="bg-secondary/30 text-xs text-muted-foreground">
                    <tr>
                      <th class="px-3 py-3 font-medium">선택</th>
                      <th class="px-3 py-3 font-medium">거래일시</th>
                      <th class="px-3 py-3 font-medium">금액</th>
                      <th class="px-3 py-3 font-medium">가맹점</th>
                      <th class="px-3 py-3 font-medium">상태</th>
                      <th class="px-3 py-3 font-medium">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={preview().rows}>
                      {(row) => {
                        const selectable = isSelectableStatus(row.status)
                        const checked = () => props.selectedFingerprints.includes(row.fingerprint)

                        return (
                          <tr class="border-t border-border/60 bg-card/40">
                            <td class="px-3 py-3 align-top">
                              <input
                                type="checkbox"
                                checked={checked()}
                                disabled={!selectable || props.commitLoading}
                                onChange={(event) => props.onToggleFingerprint(row.fingerprint, event.currentTarget.checked)}
                                class="h-4 w-4 rounded border-border bg-background text-primary"
                              />
                            </td>
                            <td class="px-3 py-3 align-top text-foreground">{row.transacted_at ? formatRecordDate(row.transacted_at) : '-'}</td>
                            <td class="px-3 py-3 align-top font-medium text-foreground">{row.amount === null ? '-' : krwFormatter.format(row.amount)}</td>
                            <td class="px-3 py-3 align-top text-foreground">{row.merchant || '기타 지출'}</td>
                            <td class="px-3 py-3 align-top">
                              <span class={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${statusBadgeClass(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td class="px-3 py-3 align-top text-xs text-muted-foreground">
                              {row.reason || (selectable ? '반영 가능' : '-')}
                            </td>
                          </tr>
                        )
                      }}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Show>

        <Show when={props.importResult}>
          {(result) => (
            <div class="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <h3 class="text-sm font-semibold text-emerald-100">가져오기 반영 결과</h3>
              <div class="mt-3 grid gap-3 md:grid-cols-3">
                <article class="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p class="text-xs text-emerald-100/75">추가된 거래</p>
                  <p class="mt-2 text-lg font-semibold text-white">{result().inserted_count}건</p>
                </article>
                <article class="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p class="text-xs text-emerald-100/75">추가 금액 합계</p>
                  <p class="mt-2 text-lg font-semibold text-white">{krwFormatter.format(result().inserted_amount_sum)}</p>
                </article>
                <article class="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p class="text-xs text-emerald-100/75">추가 순지출 합계</p>
                  <p class="mt-2 text-lg font-semibold text-white">{krwFormatter.format(result().inserted_net_amount_sum)}</p>
                </article>
              </div>
              <p class="mt-4 text-xs leading-5 text-emerald-100/85">
                반영 후 활성 기간 소비 합계는 {krwFormatter.format(result().period_total_spent_from_records)}이고 남은 예산은 {krwFormatter.format(result().remaining)}입니다.
                현재 API는 거래 원장을 기준으로 예산 요약을 자동 재계산하므로, 대시보드와 소비 기록 화면은 같은 기준을 사용합니다.
              </p>
            </div>
          )}
        </Show>
      </section>

      <section class={card}>
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-foreground">{props.editingRecordId ? '소비 기록 수정' : '소비 기록 추가'}</h2>
            <p class="mt-1 text-xs text-muted-foreground">주차 그룹은 표시용이며 예산 계산은 항상 활성 기간 기준으로 다시 계산됩니다.</p>
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
          <Show when={props.weekGroups.length > 0} fallback={<p class="text-sm text-muted-foreground">소비 기록이 없습니다.</p>}>
            <div class="space-y-5">
              <For each={props.weekGroups}>
                {(group) => (
                  <section class="space-y-3">
                    <header class="flex items-end justify-between gap-3 border-b border-border/70 pb-2">
                      <div>
                        <p class="text-xl font-semibold text-foreground">{group.week_key}</p>
                        <p class="mt-1 text-lg text-muted-foreground">{group.record_count}건</p>
                      </div>
                      <p class="text-xl font-semibold text-foreground tabular-nums">{krwFormatter.format(group.weekly_total)}</p>
                    </header>

                    <ul class="space-y-2">
                      <For each={group.records}>
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
                  </section>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </section>
    </article>
  )
}
