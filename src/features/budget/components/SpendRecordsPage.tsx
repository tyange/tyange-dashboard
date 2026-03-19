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
  deletingAll: boolean
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
  onDeleteAll: () => void
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
      return 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-200'
    case 'duplicate':
      return 'bg-amber-500/14 text-amber-700 dark:text-amber-200'
    case 'out_of_period':
      return 'bg-sky-500/14 text-sky-700 dark:text-sky-200'
    case 'invalid':
      return 'bg-rose-500/14 text-rose-700 dark:text-rose-200'
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
  const section = 'pt-8'
  const statCell = 'rounded-2xl border border-border/70 bg-background/78 px-4 py-4'
  const panel = 'rounded-[1.5rem] border border-border/70 bg-card/78 p-5 shadow-[0_14px_36px_color-mix(in_srgb,var(--shadow-color)_10%,transparent)]'
  const inputClass =
    'w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent/55'
  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-55'
  const ghostButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-card/82 px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55'
  const dangerButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-red-500/24 bg-red-500/8 px-4 text-sm font-medium text-red-500 transition hover:bg-red-500/14 disabled:cursor-not-allowed disabled:opacity-55'
  const totalRecordCount = () => props.weekGroups.reduce((sum, group) => sum + group.record_count, 0)
  const currentWeekRecords = () => props.weekGroups[0]?.record_count ?? 0
  const importExpanded = () => Boolean(props.importFileName || props.importPreview || props.importResult || props.importMessage)
  const hasSummary = () => props.fromDate !== '-' && props.toDate !== '-'

  return (
    <article aria-label="소비 기록 페이지" class="space-y-8 pb-10">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Spend Records</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">소비 기록</h1>
        </div>
        <button type="button" class={ghostButton} onClick={props.onBack}>
          대시보드로
        </button>
      </header>

      <Show when={hasSummary()}>
        <section class="border-b border-border/70 py-5">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">적용 기간</p>
              <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {props.fromDate} ~ {props.toDate}
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class={statCell}>
                <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">전체 거래</p>
                <p class="mt-2 text-3xl font-semibold text-foreground">{totalRecordCount()}</p>
              </div>
              <div class={statCell}>
                <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">이번 주</p>
                <p class="mt-2 text-3xl font-semibold text-accent">{currentWeekRecords()}</p>
              </div>
              <div class={statCell}>
                <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">총 지출</p>
                <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(props.totalSpent)}</p>
              </div>
              <div class={statCell}>
                <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">잔여</p>
                <p class={`mt-2 text-2xl font-semibold ${props.remainingBudget < 0 ? 'text-red-500' : 'text-foreground'}`}>
                  {krwFormatter.format(props.remainingBudget)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </Show>

      <Show when={props.errorMessage}>
        {(message) => (
          <div class="rounded-2xl border border-red-500/28 bg-red-500/8 px-4 py-3 text-sm text-red-500">
            {message()}
          </div>
        )}
      </Show>

      <Show when={props.successMessage}>
        {(message) => (
          <div class="rounded-2xl border border-emerald-500/24 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
            {message()}
          </div>
        )}
      </Show>

      <section class={section}>
        <div class="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Quick Input</p>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {props.editingRecordId ? '거래 수정' : '거래 추가'}
            </h2>
          </div>
          <div class="grid gap-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">금액</span>
                <input
                  type="text"
                  inputmode="numeric"
                  value={props.amountInput}
                  onInput={(event) => props.onAmountInput(digitsOnly(event.currentTarget.value))}
                  class={inputClass}
                  placeholder="12000"
                />
              </label>
              <label class="block">
                <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">가맹점</span>
                <input
                  type="text"
                  value={props.merchantInput}
                  onInput={(event) => props.onMerchantInput(event.currentTarget.value)}
                  class={inputClass}
                  placeholder="스타벅스"
                />
              </label>
            </div>
            <label class="block">
              <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">사용 일시</span>
              <input
                type="datetime-local"
                value={props.transactedAtInput}
                onInput={(event) => props.onTransactedAtInput(event.currentTarget.value)}
                class={inputClass}
              />
            </label>
            <div class="flex flex-wrap items-center gap-2">
              <Show when={props.editingRecordId !== null}>
                <button type="button" class={ghostButton} onClick={props.onCancelEditing} disabled={props.saving}>
                  취소
                </button>
              </Show>
              <button type="button" class={primaryButton} onClick={props.onSubmit} disabled={props.saving}>
                {props.saving ? '저장 중...' : props.editingRecordId ? '수정 저장' : '기록 저장'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class={section}>
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Import</p>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">신한카드 XLS 가져오기</h2>
          </div>
          <div class="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept=".xls,application/vnd.ms-excel"
              class="block w-full rounded-2xl border border-border/70 bg-background/82 px-3 py-3 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-5 file:py-2 file:text-sm file:font-semibold file:text-accent-foreground"
              onChange={(event) => props.onImportFileChange(event.currentTarget.files?.[0] ?? null)}
            />
            <button
              type="button"
              class={`${primaryButton} min-w-32`}
              onClick={props.onRequestPreview}
              disabled={!props.importFileName || props.previewLoading || props.commitLoading}
            >
              {props.previewLoading ? '미리보기 중…' : '미리보기'}
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Show when={props.importFileName}>
            {(fileName) => <span>선택 파일: {fileName()}</span>}
          </Show>
          <Show when={!props.importFileName}>
            <span>선택된 파일 없음</span>
          </Show>
        </div>

        <Show when={importExpanded()}>
          <div class="mt-5 space-y-4">
            <Show when={props.importMessage}>
              {(message) => (
                <div class="rounded-2xl border border-sky-400/24 bg-sky-500/8 px-4 py-3 text-sm text-sky-700 dark:text-sky-200">
                  {message()}
                </div>
              )}
            </Show>

            <Show when={props.importPreview}>
              {(preview) => (
                <>
                  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <article class={statCell}>
                      <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">신규 반영</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{preview().summary.new_count}건</p>
                    </article>
                    <article class={statCell}>
                      <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">중복</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{preview().summary.duplicate_count}건</p>
                    </article>
                    <article class={statCell}>
                      <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">기간 외</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{preview().summary.out_of_period_count}건</p>
                    </article>
                    <article class={statCell}>
                      <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">신규 금액</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{krwFormatter.format(preview().summary.new_amount_sum)}</p>
                    </article>
                    <article class={statCell}>
                      <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">신규 순지출</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{krwFormatter.format(preview().summary.new_net_amount_sum)}</p>
                    </article>
                  </div>

                  <div class={panel}>
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Detected</p>
                        <p class="mt-2 text-sm text-foreground">
                          감지 소스 {preview().detected_source} · 전체 {preview().summary.parsed_count}건
                        </p>
                        <p class="mt-1 text-sm text-muted-foreground">
                          반영 선택 {props.selectedFingerprints.length} / 선택 가능 {props.selectableFingerprintCount}
                        </p>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class={ghostButton}
                          onClick={props.onSelectAllFingerprints}
                          disabled={props.commitLoading || props.previewLoading || props.selectableFingerprintCount === 0}
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          class={ghostButton}
                          onClick={props.onClearSelectedFingerprints}
                          disabled={props.commitLoading || props.previewLoading || props.selectedFingerprints.length === 0}
                        >
                          선택 해제
                        </button>
                        <button
                          type="button"
                          class={primaryButton}
                          onClick={props.onCommitImport}
                          disabled={props.commitLoading || props.previewLoading || props.selectedFingerprints.length === 0}
                        >
                          {props.commitLoading ? '반영 중...' : '선택 항목 반영'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="overflow-x-auto rounded-[1.25rem] border border-border/70">
                    <table class="min-w-full border-collapse text-left text-sm">
                      <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        <tr>
                          <th class="px-4 py-3 font-medium">선택</th>
                          <th class="px-4 py-3 font-medium">거래일시</th>
                          <th class="px-4 py-3 font-medium">금액</th>
                          <th class="px-4 py-3 font-medium">가맹점</th>
                          <th class="px-4 py-3 font-medium">상태</th>
                          <th class="px-4 py-3 font-medium">사유</th>
                        </tr>
                      </thead>
                      <tbody class="bg-card/65">
                        <For each={preview().rows}>
                          {(row) => {
                            const selectable = isSelectableStatus(row.status)
                            const checked = () => props.selectedFingerprints.includes(row.fingerprint)

                            return (
                              <tr class="border-t border-border/60">
                                <td class="px-4 py-3 align-top">
                                  <input
                                    type="checkbox"
                                    checked={checked()}
                                    disabled={!selectable || props.commitLoading}
                                    onChange={(event) => props.onToggleFingerprint(row.fingerprint, event.currentTarget.checked)}
                                    class="h-4 w-4 rounded border-border bg-background text-accent"
                                  />
                                </td>
                                <td class="px-4 py-3 align-top text-foreground">
                                  {row.transacted_at ? formatRecordDate(row.transacted_at) : '-'}
                                </td>
                                <td class="px-4 py-3 align-top font-medium text-foreground">
                                  {row.amount === null ? '-' : krwFormatter.format(row.amount)}
                                </td>
                                <td class="px-4 py-3 align-top text-foreground">{row.merchant || '기타 지출'}</td>
                                <td class="px-4 py-3 align-top">
                                  <span class={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}>
                                    {statusLabel(row.status)}
                                  </span>
                                </td>
                                <td class="px-4 py-3 align-top text-xs text-muted-foreground">
                                  {row.reason || (selectable ? '반영 가능' : '-')}
                                </td>
                              </tr>
                            )
                          }}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Show>

            <Show when={props.importResult}>
              {(result) => (
                <div class="rounded-[1.5rem] border border-emerald-500/24 bg-emerald-500/8 p-5">
                  <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">가져오기 반영 결과</h3>
                  <div class="mt-4 grid gap-3 md:grid-cols-3">
                    <article class="rounded-2xl border border-emerald-500/16 bg-background/72 px-4 py-4">
                      <p class="text-xs uppercase tracking-[0.14em] text-muted-foreground">추가된 거래</p>
                      <p class="mt-2 text-2xl font-semibold text-foreground">{result().inserted_count}건</p>
                    </article>
                    <article class="rounded-2xl border border-emerald-500/16 bg-background/72 px-4 py-4">
                      <p class="text-xs uppercase tracking-[0.14em] text-muted-foreground">추가 금액 합계</p>
                      <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(result().inserted_amount_sum)}</p>
                    </article>
                    <article class="rounded-2xl border border-emerald-500/16 bg-background/72 px-4 py-4">
                      <p class="text-xs uppercase tracking-[0.14em] text-muted-foreground">추가 순지출 합계</p>
                      <p class="mt-2 text-2xl font-semibold text-foreground">{krwFormatter.format(result().inserted_net_amount_sum)}</p>
                    </article>
                  </div>
                  <p class="mt-4 text-sm leading-6 text-foreground">
                    반영 후 적용 기간 소비 합계는 {krwFormatter.format(result().period_total_spent_from_records)}이고 남은 예산은 {krwFormatter.format(result().remaining)}입니다.
                  </p>
                </div>
              )}
            </Show>
          </div>
        </Show>
      </section>

      <section class={section}>
        <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Ledger</p>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">거래 목록</h2>
          </div>
          <button
            type="button"
            class={dangerButton}
            onClick={props.onDeleteAll}
            disabled={props.loading || props.saving || props.deletingRecordId !== null || props.deletingAll || totalRecordCount() === 0}
          >
            {props.deletingAll ? '전체 삭제 중...' : '전체 삭제'}
          </button>
        </div>

        <Show when={!props.loading} fallback={<p class="text-sm text-muted-foreground">소비 기록을 불러오는 중...</p>}>
          <Show when={props.weekGroups.length > 0} fallback={<p class="text-sm text-muted-foreground">소비 기록이 없습니다.</p>}>
            <div class="space-y-8">
              <For each={props.weekGroups}>
                {(group) => (
                  <section class="space-y-3">
                    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p class="text-2xl font-semibold tracking-tight text-foreground">{group.week_key}</p>
                        <p class="mt-1 text-sm text-muted-foreground">{group.record_count}건</p>
                      </div>
                      <p class="text-xl font-semibold tracking-tight text-foreground">{krwFormatter.format(group.weekly_total)}</p>
                    </header>

                    <div class="overflow-x-auto rounded-[1.25rem] border border-border/70">
                      <table class="min-w-full border-collapse text-left text-sm">
                        <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          <tr>
                            <th class="px-4 py-3 font-medium">가맹점</th>
                            <th class="px-4 py-3 font-medium">거래일시</th>
                            <th class="px-4 py-3 font-medium">금액</th>
                            <th class="px-4 py-3 font-medium">관리</th>
                          </tr>
                        </thead>
                        <tbody class="bg-card/65">
                          <For each={group.records}>
                            {(record) => (
                              <tr class="border-t border-border/60">
                                <td class="px-4 py-3 align-middle">
                                  <p class="truncate text-base font-medium text-foreground">{record.merchant || '기타 지출'}</p>
                                </td>
                                <td class="px-4 py-3 align-middle text-muted-foreground">{formatRecordDate(record.transacted_at)}</td>
                                <td class="px-4 py-3 align-middle text-base font-semibold text-foreground">{krwFormatter.format(record.amount)}</td>
                                <td class="px-4 py-3 align-middle">
                                  <div class="flex flex-wrap items-center gap-2">
                                    <button type="button" class={ghostButton} onClick={() => props.onStartEditing(record)} disabled={props.saving}>
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      class={dangerButton}
                                      onClick={() => props.onDelete(record.record_id)}
                                      disabled={props.deletingRecordId !== null || props.deletingAll}
                                    >
                                      {props.deletingRecordId === record.record_id ? '삭제 중...' : '삭제'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
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
